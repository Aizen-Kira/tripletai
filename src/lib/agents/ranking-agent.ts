import type { PlanningContext, RankedPoi, RejectedPlace } from "@/lib/types";
import { assertContext, type PlannerAgent } from "@/lib/agents/types";

export const rankingAgent: PlannerAgent = {
  name: "ranking",
  label: "Ranking Agent",
  async execute(context) {
    const places = assertContext(context.candidatePlaces, "Ranking Agent requires candidate places.");
    const intent = assertContext(context.intent, "Ranking Agent requires intent.");
    const weather = assertContext(context.weather, "Ranking Agent requires weather.");
    const budgetPlan = assertContext(context.budgetPlan, "Ranking Agent requires budget plan.");

    const rankedPlaces = places
      .map((place): RankedPoi => {
        const mood = place.tags.filter((tag) => intent.vibeTags.includes(tag)).length * 12;
        const weatherScore = weather.recommendation === "Indoor itinerary" ? (place.indoor ? 18 : -15) : 8;
        const budget = place.estimatedCost <= budgetPlan.perStopTarget + 8 ? 18 : -10;
        const walkingTime = place.walkingTimeMinutes || estimateWalkingTime(place, context);
        const distance = Math.max(0, 14 - walkingTime);
        const popularity = Math.min(place.rating * 3 + Math.log10(place.reviewCount + 1), 18);
        const openingHours = place.isOpenNow ? 12 : -12;
        const walkingEfficiency = Math.max(0, 10 - Math.max(walkingTime - 8, 0));
        const scoreBreakdown = { mood, weather: weatherScore, budget, distance, popularity, openingHours, walkingEfficiency };
        const score = Math.round(Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0));

        return {
          ...place,
          walkingTimeMinutes: walkingTime,
          walkingDistanceMeters: place.walkingDistanceMeters || walkingTime * 80,
          score,
          scoreBreakdown
        };
      })
      .sort((a, b) => b.score - a.score);

    const selectedIds = new Set(rankedPlaces.slice(0, 3).map((place) => place.id));
    const rejectedPlaces: RejectedPlace[] = rankedPlaces
      .filter((place) => !selectedIds.has(place.id))
      .slice(0, 4)
      .map((place) => ({
        id: place.id,
        name: place.name,
        category: place.category,
        score: place.score,
        reason: rejectionReason(place, context)
      }));

    return {
      ...context,
      rankedPlaces,
      rejectedPlaces
    };
  }
};

function estimateWalkingTime(place: { id: string }, context: PlanningContext) {
  const index = context.candidatePlaces?.findIndex((candidate) => candidate.id === place.id) || 0;
  return 5 + Math.max(index, 0) * 3;
}

function rejectionReason(place: RankedPoi, context: PlanningContext) {
  if (!place.isOpenNow) return "Rejected because opening hours are uncertain for this window.";
  if (context.weather?.recommendation === "Indoor itinerary" && !place.indoor) return "Rejected because rain makes it a weaker fit.";
  if (place.estimatedCost > (context.budgetPlan?.perStopTarget || context.input.budget.max)) return "Rejected because it strains the per-stop budget.";
  if ((place.walkingTimeMinutes || 0) > 16) return "Rejected because it adds too much walking or backtracking.";
  return "Lower overall fit after mood, budget, weather, and route scoring.";
}
