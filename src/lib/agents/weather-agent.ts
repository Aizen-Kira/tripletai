import type { WeatherReport } from "@/lib/types";
import { assertContext, type PlannerAgent } from "@/lib/agents/types";

export const weatherAgent: PlannerAgent = {
  name: "weather",
  label: "Weather Agent",
  async execute(context) {
    const structuredIntent = assertContext(context.structuredIntent, "Weather Agent requires structured intent.");

    try {
      const report = await getOpenMeteoWeather(context.input.city);
      return {
        ...context,
        weather: report
      };
    } catch {
      const fallback: WeatherReport = {
        weather: structuredIntent.weatherPreference === "rain" || structuredIntent.indoorPreferred ? "Rain likely" : "Mild",
        temperature: structuredIntent.weatherPreference === "cold" ? 12 : 18,
        recommendation: structuredIntent.indoorPreferred ? "Indoor itinerary" : "Mixed itinerary",
        outdoorSuitable: !structuredIntent.indoorPreferred,
        forecastNext6Hours: structuredIntent.indoorPreferred
          ? ["Showers possible", "Cloudy", "Light rain", "Cloudy", "Drizzle", "Cloudy"]
          : ["Mild", "Mild", "Partly cloudy", "Partly cloudy", "Mild", "Mild"],
        source: "prompt-fallback"
      };

      return {
        ...context,
        weather: fallback
      };
    }
  }
};

async function getOpenMeteoWeather(city: string): Promise<WeatherReport> {
  if (process.env.DISABLE_LIVE_WEATHER === "true") {
    throw new Error("Live weather disabled.");
  }

  const geo = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    { next: { revalidate: 1800 } }
  );

  if (!geo.ok) throw new Error("Weather geocoding failed.");

  const geoJson = (await geo.json()) as {
    results?: Array<{ latitude: number; longitude: number }>;
  };
  const location = geoJson.results?.[0];
  if (!location) throw new Error("No weather location found.");

  const weather = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,precipitation,weather_code&hourly=precipitation_probability,weather_code&forecast_hours=6`,
    { next: { revalidate: 900 } }
  );

  if (!weather.ok) throw new Error("Weather fetch failed.");

  const json = (await weather.json()) as {
    current?: { temperature_2m?: number; precipitation?: number; weather_code?: number };
    hourly?: { precipitation_probability?: number[]; weather_code?: number[] };
  };

  const rainLikely =
    (json.current?.precipitation || 0) > 0 ||
    (json.hourly?.precipitation_probability || []).some((probability) => probability >= 45);

  return {
    weather: rainLikely ? "Rain" : describeWeatherCode(json.current?.weather_code),
    temperature: Math.round(json.current?.temperature_2m || 18),
    recommendation: rainLikely ? "Indoor itinerary" : "Mixed itinerary",
    outdoorSuitable: !rainLikely,
    forecastNext6Hours: (json.hourly?.weather_code || []).slice(0, 6).map(describeWeatherCode),
    source: "open-meteo"
  };
}

function describeWeatherCode(code?: number) {
  if (code === undefined) return "Mild";
  if ([61, 63, 65, 80, 81, 82, 95].includes(code)) return "Rain";
  if ([0, 1].includes(code)) return "Clear";
  if ([2, 3, 45, 48].includes(code)) return "Cloudy";
  return "Mild";
}
