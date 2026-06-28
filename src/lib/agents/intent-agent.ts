import type { Intent, PlannerInput, StructuredIntent, TransportMode } from "@/lib/types";
import type { PlannerAgent } from "@/lib/agents/types";

const vibeKeywords: Record<string, string[]> = {
  artsy: ["art", "artsy", "gallery", "museum", "creative", "design"],
  quiet: ["low-key", "quiet", "chill", "calm", "no crowds", "solo"],
  food: ["food", "cafe", "coffee", "brunch", "lunch", "street food"],
  nature: ["park", "walk", "garden", "nature", "outdoor"],
  books: ["book", "bookstore", "reading"],
  budget: ["cheap", "under", "budget", "free", "affordable"]
};

export const intentExtractorAgent: PlannerAgent = {
  name: "intent",
  label: "Intent Extractor",
  async execute(context) {
    const structuredIntent = extractStructuredIntent(context.input);
    const intent = toLegacyIntent(context.input, structuredIntent);

    return {
      ...context,
      structuredIntent,
      intent
    };
  }
};

function extractStructuredIntent(input: PlannerInput): StructuredIntent {
  const text = `${input.vibe} ${input.weather || ""} ${input.party || ""}`.toLowerCase();
  const budgetFromPrompt = text.match(/(?:under|below|less than|budget)\s*\$?(\d+)/)?.[1];
  const groupSize = text.includes("solo") || text.includes("just me") ? 1 : Number(text.match(/(\d+)\s*(people|friends|guests)/)?.[1] || 1);
  const indoorPreferred = /rain|rainy|storm|drizzle|indoor|no crowds/.test(text);

  return {
    mood: detectMood(text),
    budget: budgetFromPrompt ? Number(budgetFromPrompt) : input.budget.max,
    weatherPreference: detectWeatherPreference(text),
    duration: input.duration,
    groupSize,
    transport: normalizeTransport(input.transportMode),
    startLocation: input.startingLocation,
    energy: /packed|party|lively|adventure|night/.test(text) ? "high" : /slow|low-key|quiet|solo|calm/.test(text) ? "low" : "medium",
    indoorPreferred
  };
}

function toLegacyIntent(input: PlannerInput, structured: StructuredIntent): Intent {
  const text = input.vibe.toLowerCase();
  const vibeTags = Object.entries(vibeKeywords)
    .filter(([, words]) => words.some((word) => text.includes(word)))
    .map(([tag]) => tag);

  return {
    vibeTags: vibeTags.length ? vibeTags : [structured.mood, "local"],
    localOnly: true,
    mood: titleCase(structured.mood),
    constraints: [
      `Stay within ${input.city}`,
      `Keep total estimate under ${input.budget.currency}${structured.budget}`,
      `${structured.transport} friendly`,
      `${structured.duration} plan`,
      structured.indoorPreferred ? "Indoor preferred" : "Outdoor acceptable"
    ],
    weatherFit: structured.indoorPreferred ? "indoor" : "mixed",
    pace: structured.duration === "2-3 hours" ? "slow" : structured.duration === "full-day" ? "packed" : "balanced"
  };
}

function detectMood(text: string) {
  for (const [mood, words] of Object.entries(vibeKeywords)) {
    if (words.some((word) => text.includes(word))) {
      return mood;
    }
  }

  return "local";
}

function detectWeatherPreference(text: string): StructuredIntent["weatherPreference"] {
  if (/rain|rainy|storm|drizzle/.test(text)) return "rain";
  if (/sun|sunny|bright/.test(text)) return "sun";
  if (/cold|winter/.test(text)) return "cold";
  if (/hot|humid|heat/.test(text)) return "hot";
  return "any";
}

function normalizeTransport(transportMode: TransportMode): TransportMode {
  return transportMode;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}
