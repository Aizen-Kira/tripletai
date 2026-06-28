import type { Itinerary, ItineraryStop, RankedPoi } from "@/lib/types";
import { assertContext, type PlannerAgent } from "@/lib/agents/types";
import { uid } from "@/lib/utils";

export const timelineBuilderAgent: PlannerAgent = {
  name: "timeline",
  label: "Timeline Builder",
  async execute(context) {
    const intent = assertContext(context.intent, "Timeline Builder requires intent.");
    const structuredIntent = assertContext(context.structuredIntent, "Timeline Builder requires structured intent.");
    const weather = assertContext(context.weather, "Timeline Builder requires weather.");
    const budgetPlan = assertContext(context.budgetPlan, "Timeline Builder requires budget plan.");
    const rankedPlaces = assertContext(context.rankedPlaces, "Timeline Builder requires ranked places.");
    const selected = optimizeRoute(rankedPlaces.slice(0, structuredIntent.duration === "2-3 hours" ? 2 : 3));
    const startHour = structuredIntent.duration === "full-day" ? 10 : 13;
    let minutes = startHour * 60;

    const stops: ItineraryStop[] = selected.map((place, index) => {
      const travelMinutesFromPrevious = index === 0 ? 0 : place.walkingTimeMinutes || 8;
      minutes += travelMinutesFromPrevious;
      const arrivalTime = formatTime(minutes);
      const durationMinutes = place.category.toLowerCase().includes("cafe") ? 45 : 60;
      minutes += durationMinutes;

      return {
        ...place,
        order: index + 1,
        arrivalTime,
        durationMinutes,
        travelMinutesFromPrevious,
        whyPicked:
          context.reasoningByPlaceId?.[place.id] ||
          "Selected by the agent pipeline for mood fit, budget fit, weather compatibility, and route efficiency.",
        budgetNote:
          context.budgetNotesByPlaceId?.[place.id] ||
          (place.estimatedCost === 0 ? "Free stop." : `Estimated at ${budgetPlan.currency}${place.estimatedCost}.`),
        confidence: Math.min(Math.max(place.score, 0), 100),
        alternativeSuggestion:
          context.alternativesByPlaceId?.[place.id] || "If this is crowded, swap to the next ranked place nearby.",
        memorySignal:
          context.history?.preferredCategories.includes(place.category) || context.history?.preferredVibes.some((tag) => place.tags.includes(tag))
            ? "Matches your saved trip memory."
            : undefined
      };
    });

    const itinerary: Itinerary = {
      id: uid("trip"),
      userId: context.userId,
      title: `${intent.mood} ${structuredIntent.duration} in ${context.input.city}`,
      city: context.input.city,
      createdAt: new Date().toISOString(),
      rawPrompt: context.rawPrompt,
      input: context.input,
      intent,
      structuredIntent,
      weather,
      budgetPlan,
      candidatePlaces: context.candidatePlaces || [],
      rankedPlaces,
      rejectedPlaces: context.rejectedPlaces || [],
      stops,
      totalEstimatedCost: stops.reduce((sum, stop) => sum + stop.estimatedCost, 0),
      totalTravelMinutes: stops.reduce((sum, stop) => sum + stop.travelMinutesFromPrevious, 0),
      summary: `A ${weather.recommendation.toLowerCase()} built from ${stops.length} local stops with short ${context.input.transportMode} transfers.`,
      reasoning: [
        "Intent Extractor converted the prompt into budget, mood, energy, location, and indoor preference.",
        "Weather Agent adjusted the route toward indoor-safe stops when needed.",
        "Budget Agent kept a per-stop target and preserved a buffer.",
        "Ranking Agent scored mood, weather, budget, distance, popularity, hours, and walking efficiency.",
        "Timeline Builder ordered stops to reduce backtracking."
      ],
      confidence: Math.round(stops.reduce((sum, stop) => sum + stop.confidence, 0) / Math.max(stops.length, 1)) / 100,
      memoryUpdate: {
        preferredVibes: Array.from(new Set([...intent.vibeTags, structuredIntent.energy, "walkable"])).slice(0, 6),
        avoidedTraits: ["closed", "over-budget", weather.outdoorSuitable ? "long transfers" : "rain-exposed"],
        budgetPattern: `Usually plans under ${context.input.budget.currency}${structuredIntent.budget}`
      },
      tripRating: null
    };

    return {
      ...context,
      itinerary
    };
  }
};

function optimizeRoute(places: RankedPoi[]) {
  return [...places].sort((a, b) => (a.walkingTimeMinutes || 0) - (b.walkingTimeMinutes || 0));
}

function formatTime(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}
