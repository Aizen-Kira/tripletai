export type TransportMode = "walk" | "transit" | "bike" | "drive";

export type PlanDuration = "2-3 hours" | "half-day" | "full-day";

export type BudgetRange = {
  label: string;
  max: number;
  currency: string;
};

export type PlannerInput = {
  vibe: string;
  city: string;
  startingLocation: string;
  budget: BudgetRange;
  duration: PlanDuration;
  transportMode: TransportMode;
  weather?: string;
  party?: string;
  userId?: string;
};

export type Intent = {
  vibeTags: string[];
  localOnly: boolean;
  mood: string;
  constraints: string[];
  weatherFit: "indoor" | "outdoor" | "mixed";
  pace: "slow" | "balanced" | "packed";
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Poi = {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates: Coordinates;
  rating: number;
  reviewCount: number;
  priceLevel: 0 | 1 | 2 | 3 | 4;
  estimatedCost: number;
  isOpenNow: boolean;
  imageUrl: string;
  tags: string[];
  indoor: boolean;
  source: "google" | "foursquare" | "mock";
  walkingDistanceMeters?: number;
  walkingTimeMinutes?: number;
  openingHours?: string;
};

export type ItineraryStop = Poi & {
  order: number;
  arrivalTime: string;
  durationMinutes: number;
  travelMinutesFromPrevious: number;
  whyPicked: string;
  budgetNote: string;
  confidence: number;
  alternativeSuggestion: string;
  memorySignal?: string;
};

export type StructuredIntent = {
  mood: string;
  budget: number;
  weatherPreference: "rain" | "sun" | "cold" | "hot" | "any";
  duration: PlanDuration;
  groupSize: number;
  transport: TransportMode;
  startLocation: string;
  energy: "low" | "medium" | "high";
  indoorPreferred: boolean;
};

export type WeatherReport = {
  weather: string;
  temperature: number;
  recommendation: "Indoor itinerary" | "Outdoor friendly" | "Mixed itinerary";
  outdoorSuitable: boolean;
  forecastNext6Hours: string[];
  source: "open-meteo" | "prompt-fallback" | "mock";
};

export type BudgetAllocation = {
  category: string;
  amount: number;
  note: string;
};

export type BudgetPlan = {
  allocations: BudgetAllocation[];
  remainingBudget: number;
  perStopTarget: number;
  currency: string;
};

export type RankedPoi = Poi & {
  score: number;
  scoreBreakdown: {
    mood: number;
    weather: number;
    budget: number;
    distance: number;
    popularity: number;
    openingHours: number;
    walkingEfficiency: number;
  };
};

export type RejectedPlace = {
  id: string;
  name: string;
  category: string;
  reason: string;
  score: number;
};

export type AgentName =
  | "intent"
  | "weather"
  | "budget"
  | "places"
  | "ranking"
  | "reasoning"
  | "timeline";

export type AgentStatus = "waiting" | "running" | "complete" | "error";

export type AgentProgress = {
  name: AgentName;
  label: string;
  status: AgentStatus;
  message: string;
};

export type PlanningContext = {
  input: PlannerInput;
  rawPrompt: string;
  userId: string;
  history?: PreferenceHistory | null;
  structuredIntent?: StructuredIntent;
  intent?: Intent;
  weather?: WeatherReport;
  budgetPlan?: BudgetPlan;
  candidatePlaces?: Poi[];
  rankedPlaces?: RankedPoi[];
  rejectedPlaces?: RejectedPlace[];
  reasoningByPlaceId?: Record<string, string>;
  budgetNotesByPlaceId?: Record<string, string>;
  alternativesByPlaceId?: Record<string, string>;
  itinerary?: Itinerary;
};

export type Itinerary = {
  id: string;
  userId: string;
  title: string;
  city: string;
  createdAt: string;
  rawPrompt: string;
  input: PlannerInput;
  intent: Intent;
  structuredIntent: StructuredIntent;
  weather: WeatherReport;
  budgetPlan: BudgetPlan;
  candidatePlaces: Poi[];
  rankedPlaces: RankedPoi[];
  rejectedPlaces: RejectedPlace[];
  stops: ItineraryStop[];
  totalEstimatedCost: number;
  totalTravelMinutes: number;
  summary: string;
  reasoning: string[];
  confidence: number;
  memoryUpdate: {
    preferredVibes: string[];
    avoidedTraits: string[];
    budgetPattern: string;
  };
  tripRating?: number | null;
};

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "agent"; progress: AgentProgress }
  | { type: "intent"; intent: Intent }
  | { type: "weather"; weather: WeatherReport }
  | { type: "budget"; budgetPlan: BudgetPlan }
  | { type: "pois"; pois: Poi[] }
  | { type: "ranked"; rankedPlaces: RankedPoi[]; rejectedPlaces: RejectedPlace[] }
  | { type: "itinerary"; itinerary: Itinerary }
  | { type: "token"; text: string }
  | { type: "error"; message: string };

export type PreferenceHistory = {
  userId: string;
  preferredVibes: string[];
  preferredCategories: string[];
  averageBudget: number;
  lastCity?: string;
  updatedAt: string;
};
