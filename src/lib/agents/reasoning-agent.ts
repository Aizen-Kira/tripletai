import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { assertContext, type PlannerAgent } from "@/lib/agents/types";
import type { PlanningContext } from "@/lib/types";

export const reasoningAgent: PlannerAgent = {
  name: "reasoning",
  label: "Reasoning Agent",
  async execute(context) {
    const rankedPlaces = assertContext(context.rankedPlaces, "Reasoning Agent requires ranked places.");
    const selected = rankedPlaces.slice(0, 3);

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { text } = await generateText({
          model: anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"),
          temperature: 0.25,
          system:
            "You are the Reasoning Agent for Triplet AI. Generate concise user-facing explanations. Return strict JSON only.",
          prompt: JSON.stringify({
            task: "Explain every selected place and provide one alternative suggestion for each. Include why rejected places were not selected.",
            input: context.input,
            structuredIntent: context.structuredIntent,
            weather: context.weather,
            budgetPlan: context.budgetPlan,
            selected,
            rejectedPlaces: context.rejectedPlaces,
            outputShape: {
              reasoningByPlaceId: { "place id": "explainable reasoning" },
              budgetNotesByPlaceId: { "place id": "budget note" },
              alternativesByPlaceId: { "place id": "alternative suggestion" },
              rejectedReasonsById: { "place id": "why not selected" }
            }
          })
        });

        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
          reasoningByPlaceId?: Record<string, string>;
          budgetNotesByPlaceId?: Record<string, string>;
          alternativesByPlaceId?: Record<string, string>;
          rejectedReasonsById?: Record<string, string>;
        };

        return {
          ...context,
          reasoningByPlaceId: parsed.reasoningByPlaceId || buildFallbackReasons(context),
          budgetNotesByPlaceId: parsed.budgetNotesByPlaceId || buildFallbackBudgetNotes(context),
          alternativesByPlaceId: parsed.alternativesByPlaceId || buildFallbackAlternatives(context),
          rejectedPlaces: (context.rejectedPlaces || []).map((place) => ({
            ...place,
            reason: parsed.rejectedReasonsById?.[place.id] || place.reason
          }))
        };
      } catch (error) {
        console.warn("Reasoning Agent Claude call failed, using deterministic reasoning", error);
      }
    }

    return {
      ...context,
      reasoningByPlaceId: buildFallbackReasons(context),
      budgetNotesByPlaceId: buildFallbackBudgetNotes(context),
      alternativesByPlaceId: buildFallbackAlternatives(context)
    };
  }
};

function buildFallbackReasons(context: PlanningContext) {
  return Object.fromEntries(
    (context.rankedPlaces || []).slice(0, 3).map((place) => [
      place.id,
      [
        `Chosen because it matches the ${context.structuredIntent?.mood || "local"} mood.`,
        place.isOpenNow ? "Open during your planning window." : "Worth checking hours before you go.",
        place.indoor ? "Indoor-friendly for the current weather read." : "Adds an outdoor option if conditions hold.",
        `${place.walkingTimeMinutes || 8}-minute walk keeps the route compact.`,
        `${place.rating.toFixed(1)} rating gives it a strong local signal.`
      ].join(" ")
    ])
  );
}

function buildFallbackBudgetNotes(context: PlanningContext) {
  return Object.fromEntries(
    (context.rankedPlaces || []).slice(0, 3).map((place) => [
      place.id,
      place.estimatedCost === 0
        ? "Free stop protects your budget buffer."
        : `Estimated at ${context.budgetPlan?.currency || "$"}${place.estimatedCost}, near the per-stop target of ${context.budgetPlan?.currency || "$"}${context.budgetPlan?.perStopTarget || place.estimatedCost}.`
    ])
  );
}

function buildFallbackAlternatives(context: PlanningContext) {
  return Object.fromEntries(
    (context.rankedPlaces || []).slice(0, 3).map((place, index) => [
      place.id,
      index === 0 ? "Swap for the bookstore if you want an even quieter start." : `Swap for another ${place.category.toLowerCase()} if this stop is busy.`
    ])
  );
}
