import { fetchNearbyPois } from "@/lib/places";
import { assertContext, type PlannerAgent } from "@/lib/agents/types";

export const placesAgent: PlannerAgent = {
  name: "places",
  label: "Places Agent",
  async execute(context) {
    const intent = assertContext(context.intent, "Places Agent requires intent.");
    const places = await fetchNearbyPois(context.input, intent);

    return {
      ...context,
      candidatePlaces: places
    };
  }
};
