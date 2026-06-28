import { demoPois } from "@/lib/mock-data";
import type { Intent, PlannerInput, Poi } from "@/lib/types";

export async function fetchNearbyPois(input: PlannerInput, intent: Intent): Promise<Poi[]> {
  const providers = [
    process.env.GOOGLE_PLACES_API_KEY ? fetchGooglePlaces : null,
    process.env.FOURSQUARE_API_KEY ? fetchFoursquarePlaces : null
  ].filter(Boolean) as Array<(input: PlannerInput, intent: Intent) => Promise<Poi[]>>;

  for (const provider of providers) {
    try {
      const places = await provider(input, intent);
      if (places.length > 0) {
        return filterPois(places, input, intent);
      }
    } catch (error) {
      console.warn("POI provider failed, trying fallback", error);
    }
  }

  return filterPois(demoPois, input, intent);
}

function filterPois(pois: Poi[], input: PlannerInput, intent: Intent) {
  return pois
    .filter((poi) => poi.estimatedCost <= Math.max(input.budget.max, 1))
    .filter((poi) => (intent.weatherFit === "indoor" ? poi.indoor : true))
    .sort((a, b) => scorePoi(b, intent) - scorePoi(a, intent))
    .slice(0, 6);
}

function scorePoi(poi: Poi, intent: Intent) {
  const tagScore = poi.tags.filter((tag) => intent.vibeTags.includes(tag)).length * 2;
  const ratingScore = poi.rating;
  const costScore = Math.max(0, 4 - poi.priceLevel);
  const openScore = poi.isOpenNow ? 2 : -2;
  return tagScore + ratingScore + costScore + openScore;
}

async function fetchGooglePlaces(input: PlannerInput, intent: Intent): Promise<Poi[]> {
  const query = `${intent.vibeTags.join(" ")} things to do near ${input.startingLocation}, ${input.city}`;
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY || "",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.types,places.photos"
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 8,
      includedType: "tourist_attraction"
    }),
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Google Places returned ${response.status}`);
  }

  const json = (await response.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      rating?: number;
      userRatingCount?: number;
      priceLevel?: string;
      currentOpeningHours?: { openNow?: boolean };
      types?: string[];
    }>;
  };

  return (json.places || []).map((place, index) => ({
    id: place.id,
    name: place.displayName?.text || "Local place",
    category: normalizeCategory(place.types?.[0]),
    address: place.formattedAddress || input.city,
    coordinates: {
      lat: place.location?.latitude || 40.72 + index / 1000,
      lng: place.location?.longitude || -73.99 - index / 1000
    },
    rating: place.rating || 4.4,
    reviewCount: place.userRatingCount || 100,
    priceLevel: normalizeGooglePrice(place.priceLevel),
    estimatedCost: estimateCost(normalizeGooglePrice(place.priceLevel)),
    isOpenNow: place.currentOpeningHours?.openNow ?? true,
    imageUrl: demoPois[index % demoPois.length].imageUrl,
    tags: [...(place.types || []), ...intent.vibeTags],
    indoor: true,
    source: "google",
    walkingDistanceMeters: 360 + index * 180,
    walkingTimeMinutes: 5 + index * 3,
    openingHours: place.currentOpeningHours?.openNow ? "Open now" : "Check hours"
  }));
}

async function fetchFoursquarePlaces(input: PlannerInput, intent: Intent): Promise<Poi[]> {
  const params = new URLSearchParams({
    query: intent.vibeTags.join(","),
    near: `${input.startingLocation}, ${input.city}`,
    limit: "8",
    sort: "RATING"
  });

  const response = await fetch(`https://api.foursquare.com/v3/places/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: process.env.FOURSQUARE_API_KEY || ""
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Foursquare returned ${response.status}`);
  }

  const json = (await response.json()) as {
    results?: Array<{
      fsq_id: string;
      name: string;
      location?: { formatted_address?: string };
      geocodes?: { main?: { latitude?: number; longitude?: number } };
      categories?: Array<{ name?: string }>;
    }>;
  };

  return (json.results || []).map((place, index) => ({
    id: place.fsq_id,
    name: place.name,
    category: place.categories?.[0]?.name || "Local spot",
    address: place.location?.formatted_address || input.city,
    coordinates: {
      lat: place.geocodes?.main?.latitude || 40.72 + index / 1000,
      lng: place.geocodes?.main?.longitude || -73.99 - index / 1000
    },
    rating: 4.5 - index * 0.05,
    reviewCount: 180 + index * 72,
    priceLevel: (index % 3) as 0 | 1 | 2,
    estimatedCost: [0, 8, 16][index % 3],
    isOpenNow: index !== 4,
    imageUrl: demoPois[index % demoPois.length].imageUrl,
    tags: [place.categories?.[0]?.name?.toLowerCase() || "local", ...intent.vibeTags],
    indoor: intent.weatherFit === "indoor" || index % 2 === 0,
    source: "foursquare",
    walkingDistanceMeters: 360 + index * 180,
    walkingTimeMinutes: 5 + index * 3,
    openingHours: index !== 4 ? "Open now" : "Check hours"
  }));
}

function normalizeCategory(value?: string) {
  if (!value) return "Local spot";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeGooglePrice(value?: string): 0 | 1 | 2 | 3 | 4 {
  const map: Record<string, 0 | 1 | 2 | 3 | 4> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4
  };
  return value ? map[value] || 1 : 1;
}

function estimateCost(priceLevel: number) {
  return [0, 8, 18, 35, 60][priceLevel] || 12;
}
