import { z } from "zod";
import { listItineraries, saveItinerary } from "@/lib/db";
import type { Itinerary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveSchema = z.object({
  itinerary: z.custom<Itinerary>(),
  userId: z.string().optional()
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user";
  const itineraries = await listItineraries(userId);

  return Response.json({ itineraries, persisted: itineraries.length > 0 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = saveSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await saveItinerary({
    ...parsed.data.itinerary,
    userId: parsed.data.userId || parsed.data.itinerary.userId
  });

  return Response.json(result);
}
