import { streamPlanNarrative } from "@/lib/ai";
import { getPreferenceHistory } from "@/lib/db";
import { budgetAgent } from "@/lib/agents/budget-agent";
import { intentExtractorAgent } from "@/lib/agents/intent-agent";
import { placesAgent } from "@/lib/agents/places-agent";
import { rankingAgent } from "@/lib/agents/ranking-agent";
import { reasoningAgent } from "@/lib/agents/reasoning-agent";
import { timelineBuilderAgent } from "@/lib/agents/timeline-agent";
import { weatherAgent } from "@/lib/agents/weather-agent";
import type { AgentName, AgentProgress, PlannerInput, PlanningContext, StreamEvent } from "@/lib/types";

type Emit = (event: StreamEvent) => void;

const agents = [
  intentExtractorAgent,
  weatherAgent,
  budgetAgent,
  placesAgent,
  rankingAgent,
  reasoningAgent,
  timelineBuilderAgent
];

const stageMessages: Record<AgentName, { running: string; complete: string }> = {
  intent: {
    running: "Understanding your request...",
    complete: "Mood, budget, location, and energy detected."
  },
  weather: {
    running: "Checking weather fit...",
    complete: "Weather preference applied."
  },
  budget: {
    running: "Allocating budget across stops...",
    complete: "Budget buffer reserved."
  },
  places: {
    running: "Searching nearby places...",
    complete: "Candidate places collected."
  },
  ranking: {
    running: "Ranking recommendations...",
    complete: "Places scored by mood, budget, weather, and route fit."
  },
  reasoning: {
    running: "Generating explanations...",
    complete: "Recommendation reasoning and alternatives ready."
  },
  timeline: {
    running: "Building itinerary...",
    complete: "Timeline optimized."
  }
};

export function initialAgentProgress(): AgentProgress[] {
  return agents.map((agent) => ({
    name: agent.name as AgentName,
    label: agent.label,
    status: "waiting",
    message: "Waiting"
  }));
}

export async function runPlanner(input: PlannerInput, emit: Emit) {
  let context: PlanningContext = {
    input,
    rawPrompt: input.vibe,
    userId: input.userId || process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user",
    history: await getPreferenceHistory(input.userId || "demo-user")
  };

  for (const agent of agents) {
    const name = agent.name as AgentName;
    emitProgress(emit, name, agent.label, "running", stageMessages[name].running);
    emit({ type: "status", message: stageMessages[name].running });

    try {
      context = await agent.execute(context);
      emitAgentOutput(emit, context, name);
      emitProgress(emit, name, agent.label, "complete", stageMessages[name].complete);
    } catch (error) {
      emitProgress(
        emit,
        name,
        agent.label,
        "error",
        error instanceof Error ? error.message : `${agent.label} failed.`
      );
      throw error;
    }
  }

  if (!context.itinerary) {
    throw new Error("Planner completed without an itinerary.");
  }

  emit({ type: "status", message: "Streaming the final plan into the workspace..." });
  for await (const text of streamPlanNarrative(context.itinerary)) {
    emit({ type: "token", text });
  }

  emit({ type: "itinerary", itinerary: context.itinerary });
}

function emitProgress(
  emit: Emit,
  name: AgentName,
  label: string,
  status: AgentProgress["status"],
  message: string
) {
  emit({
    type: "agent",
    progress: {
      name,
      label,
      status,
      message
    }
  });
}

function emitAgentOutput(emit: Emit, context: PlanningContext, name: AgentName) {
  if (name === "intent" && context.intent) {
    emit({ type: "intent", intent: context.intent });
  }

  if (name === "weather" && context.weather) {
    emit({ type: "weather", weather: context.weather });
  }

  if (name === "budget" && context.budgetPlan) {
    emit({ type: "budget", budgetPlan: context.budgetPlan });
  }

  if (name === "places" && context.candidatePlaces) {
    emit({ type: "pois", pois: context.candidatePlaces });
  }

  if (name === "ranking" && context.rankedPlaces && context.rejectedPlaces) {
    emit({
      type: "ranked",
      rankedPlaces: context.rankedPlaces,
      rejectedPlaces: context.rejectedPlaces
    });
  }
}
