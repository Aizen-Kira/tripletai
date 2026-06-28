import type {
  BudgetPlan,
  Intent,
  Itinerary,
  PlannerInput,
  Poi,
  PreferenceHistory,
  RankedPoi,
  StructuredIntent,
  WeatherReport
} from "@/lib/types";
import { uid } from "@/lib/utils";

export const demoPois: Poi[] = [
  {
    id: "mock-print-room",
    name: "The Print Room Cafe",
    category: "Cafe",
    address: "42 Arts District Lane",
    coordinates: { lat: 40.7206, lng: -73.9971 },
    rating: 4.7,
    reviewCount: 1240,
    priceLevel: 2,
    estimatedCost: 16,
    isOpenNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    tags: ["coffee", "quiet", "artsy", "rainy", "solo"],
    indoor: true,
    source: "mock",
    walkingDistanceMeters: 320,
    walkingTimeMinutes: 5,
    openingHours: "Open until 6:00 PM"
  },
  {
    id: "mock-corner-gallery",
    name: "Cornerlight Gallery",
    category: "Gallery",
    address: "16 Mercer Street",
    coordinates: { lat: 40.7221, lng: -73.9993 },
    rating: 4.8,
    reviewCount: 890,
    priceLevel: 0,
    estimatedCost: 0,
    isOpenNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=1200&q=80",
    tags: ["gallery", "artsy", "indoor", "low-key", "free"],
    indoor: true,
    source: "mock",
    walkingDistanceMeters: 560,
    walkingTimeMinutes: 8,
    openingHours: "Open until 7:00 PM"
  },
  {
    id: "mock-paper-studio",
    name: "Paper & Clay Studio",
    category: "Workshop",
    address: "8 Crosby Walk",
    coordinates: { lat: 40.7191, lng: -74.0005 },
    rating: 4.6,
    reviewCount: 420,
    priceLevel: 2,
    estimatedCost: 12,
    isOpenNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
    tags: ["maker", "artsy", "hands-on", "indoor", "slow"],
    indoor: true,
    source: "mock",
    walkingDistanceMeters: 760,
    walkingTimeMinutes: 11,
    openingHours: "Open until 5:30 PM"
  },
  {
    id: "mock-arcade-books",
    name: "Arcade Books",
    category: "Bookshop",
    address: "75 Grand Avenue",
    coordinates: { lat: 40.7183, lng: -73.9956 },
    rating: 4.5,
    reviewCount: 620,
    priceLevel: 1,
    estimatedCost: 8,
    isOpenNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
    tags: ["books", "solo", "quiet", "rainy", "low-key"],
    indoor: true,
    source: "mock",
    walkingDistanceMeters: 920,
    walkingTimeMinutes: 13,
    openingHours: "Open until 8:00 PM"
  },
  {
    id: "mock-market-yard",
    name: "Market Yard Tasting Row",
    category: "Food Market",
    address: "2 Canal Market",
    coordinates: { lat: 40.7169, lng: -73.9998 },
    rating: 4.4,
    reviewCount: 2100,
    priceLevel: 2,
    estimatedCost: 18,
    isOpenNow: false,
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    tags: ["food", "lively", "covered", "weekend"],
    indoor: true,
    source: "mock",
    walkingDistanceMeters: 1280,
    walkingTimeMinutes: 17,
    openingHours: "Closed now"
  }
];

export const demoHistory: PreferenceHistory = {
  userId: "demo-user",
  preferredVibes: ["quiet", "artsy", "walkable"],
  preferredCategories: ["Gallery", "Cafe", "Bookshop"],
  averageBudget: 28,
  lastCity: "New York",
  updatedAt: new Date().toISOString()
};

export function createFallbackItinerary(input: PlannerInput, intent: Intent, pois: Poi[] = demoPois): Itinerary {
  const selected = pois.slice(0, 3);
  let runningCost = 0;
  const structuredIntent: StructuredIntent = {
    mood: intent.vibeTags[0] || "local",
    budget: input.budget.max,
    weatherPreference: intent.weatherFit === "indoor" ? "rain" : "any",
    duration: input.duration,
    groupSize: input.party?.toLowerCase().includes("solo") ? 1 : 1,
    transport: input.transportMode,
    startLocation: input.startingLocation,
    energy: intent.pace === "slow" ? "low" : intent.pace === "packed" ? "high" : "medium",
    indoorPreferred: intent.weatherFit === "indoor"
  };
  const weather: WeatherReport = {
    weather: structuredIntent.indoorPreferred ? "Rain likely" : "Mild",
    temperature: 18,
    recommendation: structuredIntent.indoorPreferred ? "Indoor itinerary" : "Mixed itinerary",
    outdoorSuitable: !structuredIntent.indoorPreferred,
    forecastNext6Hours: ["Cloudy", "Cloudy", "Mild", "Mild", "Mild", "Mild"],
    source: "mock"
  };
  const budgetPlan: BudgetPlan = {
    allocations: [
      { category: "Coffee", amount: Math.min(6, input.budget.max), note: "Low-cost opener." },
      { category: "Culture", amount: Math.min(12, input.budget.max), note: "Main local experience." },
      { category: "Flex stop", amount: Math.min(8, input.budget.max), note: "Optional closer." }
    ],
    remainingBudget: Math.max(input.budget.max - 26, 0),
    perStopTarget: Math.floor(input.budget.max / 3),
    currency: input.budget.currency
  };
  const rankedPlaces: RankedPoi[] = pois.map((poi, index) => ({
    ...poi,
    walkingTimeMinutes: poi.walkingTimeMinutes || 5 + index * 3,
    walkingDistanceMeters: poi.walkingDistanceMeters || (5 + index * 3) * 80,
    score: Math.max(96 - index * 7, 60),
    scoreBreakdown: {
      mood: 20 - index,
      weather: poi.indoor ? 18 : 8,
      budget: poi.estimatedCost <= budgetPlan.perStopTarget + 8 ? 18 : 8,
      distance: 12,
      popularity: 14,
      openingHours: poi.isOpenNow ? 12 : -8,
      walkingEfficiency: 10
    }
  }));

  const stops = selected.map((poi, index) => {
    const ranked = rankedPlaces.find((place) => place.id === poi.id);
    runningCost += poi.estimatedCost;

    return {
      ...poi,
      walkingTimeMinutes: ranked?.walkingTimeMinutes || 5 + index * 3,
      walkingDistanceMeters: ranked?.walkingDistanceMeters || (5 + index * 3) * 80,
      order: index + 1,
      arrivalTime: index === 0 ? "1:00 PM" : index === 1 ? "2:10 PM" : "3:25 PM",
      durationMinutes: index === 0 ? 45 : index === 1 ? 60 : 50,
      travelMinutesFromPrevious: index === 0 ? 0 : index === 1 ? 8 : 11,
      whyPicked:
        index === 0
          ? "Starts with a low-cost indoor reset that matches the quiet, artsy mood and gives you time to settle in before the main stop."
          : index === 1
            ? "Adds the strongest local culture signal while staying free, close by, and rain-safe."
            : "Closes with a hands-on stop that keeps the plan personal without pushing the budget over the limit.",
      budgetNote:
        poi.estimatedCost === 0
          ? "Free entry keeps the trip budget flexible."
          : `Estimated at $${poi.estimatedCost}, leaving $${Math.max(input.budget.max - runningCost, 0)} in cushion.`,
      confidence: ranked?.score || 85,
      alternativeSuggestion: "If this is busy, swap in the next ranked quiet indoor place nearby.",
      memorySignal: index === 1 ? "Boosts your saved preference for small galleries and quiet walks." : undefined
    };
  });

  return {
    id: uid("trip"),
    userId: input.userId || "demo-user",
    title: `${intent.mood || "Local"} ${input.duration} in ${input.city || "your city"}`,
    city: input.city || "Local city",
    createdAt: new Date().toISOString(),
    rawPrompt: input.vibe,
    input,
    intent,
    structuredIntent,
    weather,
    budgetPlan,
    candidatePlaces: pois,
    rankedPlaces,
    rejectedPlaces: rankedPlaces.slice(3).map((place) => ({
      id: place.id,
      name: place.name,
      category: place.category,
      reason: place.isOpenNow ? "Lower overall fit than the selected route." : "Rejected because opening hours are uncertain.",
      score: place.score
    })),
    stops,
    totalEstimatedCost: stops.reduce((sum, stop) => sum + stop.estimatedCost, 0),
    totalTravelMinutes: stops.reduce((sum, stop) => sum + stop.travelMinutesFromPrevious, 0),
    summary:
      "A compact same-city plan with indoor-first stops, short transfers, and budget slack for a spontaneous snack or ride home.",
    reasoning: [
      "Filtered for local, same-city stops that fit the stated budget and time window.",
      "Prioritized indoor or covered places because the prompt mentions rain.",
      "Ranked quiet cultural stops higher than crowded food or nightlife options.",
      "Kept travel time low so the half-day outing feels relaxed instead of logistical."
    ],
    confidence: 0.87,
    memoryUpdate: {
      preferredVibes: Array.from(new Set([...intent.vibeTags, "walkable"])).slice(0, 5),
      avoidedTraits: ["crowded", "high-cost"],
      budgetPattern: `Usually plans under ${input.budget.currency}${input.budget.max}`
    }
  };
}
