import { anthropic } from "@ai-sdk/anthropic";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { streamText, generateText } from "ai";
import type { Intent, Itinerary, PlannerInput, Poi, PreferenceHistory } from "@/lib/types";
import { createFallbackItinerary } from "@/lib/mock-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getModel(): { model: any; source: string } {
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      model: anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"),
      source: "anthropic"
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      model: openai(process.env.OPENAI_MODEL || "gpt-4o"),
      source: "openai"
    };
  }
  if (process.env.NVIDIA_API_KEY) {
    const nvidia = createOpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
    });
    return {
      model: nvidia(process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1"),
      source: "nvidia"
    };
  }
  throw new Error(
    "No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or NVIDIA_API_KEY."
  );
}

export async function buildRankedItinerary(
  input: PlannerInput,
  intent: Intent,
  pois: Poi[],
  history?: PreferenceHistory | null
): Promise<Itinerary> {
  const fallback = createFallbackItinerary(input, intent, pois);
  const { model } = getModel();

  if (!model) {
    return fallback;
  }

  try {
    const { text } = await generateText({
      model,
      temperature: 0.3,
      system:
        "You are Triplet AI, a hyper-local weekend planner. Rank local POIs only. Respect budget, weather, time, opening status, and short-distance travel. Return strict JSON only.",
      prompt: JSON.stringify({
        task:
          "Choose exactly 3 stops and produce transparent user-facing reasoning. Do not invent places outside the supplied POIs.",
        input,
        intent,
        preferenceHistory: history,
        candidatePois: pois,
        outputShape: {
          title: "string",
          summary: "string",
          stopIds: ["poi id"],
          reasonsByPoiId: { "poi id": "why this was picked" },
          budgetNotesByPoiId: { "poi id": "budget note" },
          reasoning: ["global decision reason"],
          confidence: 0.85
        }
      })
    });

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
      title?: string;
      summary?: string;
      stopIds?: string[];
      reasonsByPoiId?: Record<string, string>;
      budgetNotesByPoiId?: Record<string, string>;
      reasoning?: string[];
      confidence?: number;
    };

    const chosen = (parsed.stopIds || [])
      .map((id) => pois.find((poi) => poi.id === id))
      .filter(Boolean) as Poi[];

    if (chosen.length < 2) {
      return fallback;
    }

    const stops = chosen.slice(0, 3).map((poi, index) => ({
      ...poi,
      order: index + 1,
      arrivalTime: index === 0 ? "1:00 PM" : index === 1 ? "2:10 PM" : "3:25 PM",
      durationMinutes: index === 1 ? 60 : 45,
      travelMinutesFromPrevious: index === 0 ? 0 : 7 + index * 3,
      whyPicked:
        parsed.reasonsByPoiId?.[poi.id] ||
        "Selected because it aligns with the requested vibe, local distance, and budget constraints.",
      budgetNote:
        parsed.budgetNotesByPoiId?.[poi.id] ||
        (poi.estimatedCost === 0 ? "Free stop." : `Estimated at $${poi.estimatedCost}.`),
      confidence: Math.max(88 - index * 4, 76),
      alternativeSuggestion: "If this stop is crowded, swap to the next ranked local place nearby.",
      memorySignal:
        history?.preferredCategories.includes(poi.category) || history?.preferredVibes.some((tag) => poi.tags.includes(tag))
          ? "Matches your saved trip memory."
          : undefined
    }));

    return {
      ...fallback,
      title: parsed.title || fallback.title,
      summary: parsed.summary || fallback.summary,
      stops,
      totalEstimatedCost: stops.reduce((sum, stop) => sum + stop.estimatedCost, 0),
      totalTravelMinutes: stops.reduce((sum, stop) => sum + stop.travelMinutesFromPrevious, 0),
      reasoning: parsed.reasoning?.length ? parsed.reasoning : fallback.reasoning,
      confidence: parsed.confidence || fallback.confidence
    };
  } catch (error) {
    console.warn("AI ranking failed, using deterministic fallback", error);
    return fallback;
  }
}

export async function* streamPlanNarrative(itinerary: Itinerary): AsyncGenerator<string> {
  const { model, source } = getModel();
  const fallback =
    `${itinerary.title}. ${itinerary.summary} ` +
    `Triplet kept this to ${itinerary.stops.length} stops, about $${itinerary.totalEstimatedCost}, ` +
    `and ${itinerary.totalTravelMinutes} minutes of ${itinerary.input.transportMode} transfers.`;

  if (!model) {
    yield* simulateTokens(fallback);
    return;
  }

  try {
    const result = streamText({
      model,
      temperature: 0.4,
      system:
        "Write concise product UI copy for a mapped itinerary. Explain the plan without sounding like a chatbot.",
      prompt: `In 2 short sentences, introduce this same-city plan and mention budget discipline. Provider: ${source}. Itinerary: ${JSON.stringify(
        itinerary
      )}`
    });

    for await (const delta of result.textStream) {
      yield delta;
    }
  } catch (error) {
    console.warn("AI streaming failed, using simulated stream", error);
    yield* simulateTokens(fallback);
  }
}

async function* simulateTokens(text: string): AsyncGenerator<string> {
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    await new Promise((resolve) => setTimeout(resolve, 12));
    yield part;
  }
}
