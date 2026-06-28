import { z } from "zod";
import { runPlanner } from "@/lib/agents/planner";
import type { PlannerInput, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  vibe: z.string().min(3),
  city: z.string().min(2),
  startingLocation: z.string().min(2),
  budget: z.object({
    label: z.string(),
    max: z.number().positive(),
    currency: z.string().default("USD")
  }),
  duration: z.enum(["2-3 hours", "half-day", "full-day"]),
  transportMode: z.enum(["walk", "transit", "bike", "drive"]),
  weather: z.string().optional(),
  party: z.string().optional(),
  userId: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input: PlannerInput = {
    ...parsed.data,
    userId: parsed.data.userId || process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user"
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await runPlanner(input, send);
      } catch (error) {
        console.error(error);
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Triplet could not finish this plan."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
