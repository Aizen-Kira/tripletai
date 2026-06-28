"use client";

import { BrainCircuit, Clock, Footprints, Lightbulb, Route, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Itinerary } from "@/lib/types";
import { compactNumber, formatMoney } from "@/lib/utils";

type ItineraryTimelineProps = {
  itinerary: Itinerary | null;
  isLoading: boolean;
};

export function ItineraryTimeline({ itinerary, isLoading }: ItineraryTimelineProps) {
  if (!itinerary && !isLoading) {
    return (
      <section className="rounded-lg border border-dashed border-emerald-300 bg-white/70 p-6">
        <p className="text-sm font-semibold text-emerald-900">Your mapped lineup appears here.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a same-city vibe and Triplet will build a route with reasons, costs, and travel time.
        </p>
      </section>
    );
  }

  if (!itinerary) {
    return (
      <section className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-48 animate-pulse rounded-lg border border-border bg-white/80" />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">The lineup</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal">{itinerary.title}</h2>
        </div>
        <Badge tone="outline">{itinerary.stops.length} stops</Badge>
      </div>

      {itinerary.stops.map((stop) => (
        <article
          key={stop.id}
          className="group overflow-hidden rounded-lg border border-border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="relative h-48 overflow-hidden bg-emerald-950">
            <img
              src={stop.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-black/70 text-sm font-bold text-white">
                {stop.order}
              </span>
              <Badge>{stop.category}</Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                {stop.arrivalTime} - {stop.durationMinutes} min
              </span>
              <span className="text-sm font-semibold">
                {stop.estimatedCost === 0 ? "Free" : formatMoney(stop.estimatedCost, itinerary.input.budget.currency)}
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-normal">{stop.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{stop.address}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-emerald-700">
                {stop.isOpenNow ? "Open now" : "Check hours"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {stop.rating.toFixed(1)} ({compactNumber(stop.reviewCount)})
              </span>
              <span className="flex items-center gap-1">
                <Footprints className="h-4 w-4 text-emerald-700" />
                {stop.travelMinutesFromPrevious === 0 ? "Start here" : `${stop.travelMinutesFromPrevious} min transfer`}
              </span>
              <span className="flex items-center gap-1">
                <Route className="h-4 w-4 text-emerald-700" />
                {Math.round((stop.walkingDistanceMeters || 400) / 10) / 100} km -{" "}
                {stop.walkingTimeMinutes || stop.travelMinutesFromPrevious || 5} min walk
              </span>
              <span className="font-semibold text-emerald-700">{stop.confidence}% confidence</span>
            </div>

            <div className="mt-5 rounded-lg border-l-4 border-primary bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <BrainCircuit className="h-4 w-4" />
                Why Triplet picked this
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-950">{stop.whyPicked}</p>
              <p className="mt-2 text-sm font-semibold text-emerald-800">{stop.budgetNote}</p>
              {stop.memorySignal ? <p className="mt-2 text-xs text-emerald-700">{stop.memorySignal}</p> : null}
            </div>

            <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                <span className="font-bold">Alternative: </span>
                {stop.alternativeSuggestion}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
