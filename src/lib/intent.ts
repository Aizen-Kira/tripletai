import type { Intent, PlannerInput } from "@/lib/types";

const vibeKeywords: Record<string, string[]> = {
  artsy: ["art", "artsy", "gallery", "museum", "creative", "design"],
  "low-key": ["low-key", "quiet", "chill", "calm", "no crowds", "solo"],
  rainy: ["rain", "rainy", "drizzle", "storm", "indoor"],
  food: ["food", "cafe", "brunch", "coffee", "street food", "snack"],
  nature: ["park", "walk", "garden", "nature", "outdoor"],
  romantic: ["date", "romantic", "cozy"],
  budget: ["cheap", "under", "budget", "free", "affordable"]
};

export function extractIntent(input: PlannerInput): Intent {
  const text = `${input.vibe} ${input.weather || ""} ${input.party || ""}`.toLowerCase();
  const vibeTags = Object.entries(vibeKeywords)
    .filter(([, words]) => words.some((word) => text.includes(word)))
    .map(([tag]) => tag);

  const weatherFit = text.includes("rain") || text.includes("indoor") ? "indoor" : "mixed";
  const pace = input.duration === "2-3 hours" ? "slow" : input.duration === "full-day" ? "packed" : "balanced";

  return {
    vibeTags: vibeTags.length ? vibeTags : ["local", "weekend", "balanced"],
    localOnly: true,
    mood: vibeTags.includes("artsy") ? "Artsy and low-key" : "Local weekend",
    constraints: [
      `Stay within ${input.city || "the same city"}`,
      `Keep total estimate under ${input.budget.currency}${input.budget.max}`,
      `${input.transportMode} friendly`,
      `${input.duration} plan`
    ],
    weatherFit,
    pace
  };
}
