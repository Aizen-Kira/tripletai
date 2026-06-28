"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, CalendarDays, MapPin, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Itinerary } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function SavedTrips() {
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [source, setSource] = useState("Local memory");

  useEffect(() => {
    const localTrips = JSON.parse(localStorage.getItem("triplet:saved-itineraries") || "[]") as Itinerary[];
    setTrips(localTrips);

    fetch(`/api/itineraries?userId=${process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user"}`)
      .then((response) => response.json())
      .then((data: { itineraries?: Itinerary[]; persisted?: boolean }) => {
        if (data.itineraries?.length) {
          setTrips(data.itineraries);
          setSource(data.persisted ? "DynamoDB memory" : "Local memory");
        }
      })
      .catch(() => setSource("Local memory"));
  }, []);

  const vibes = Array.from(new Set(trips.flatMap((trip) => trip.memoryUpdate.preferredVibes))).slice(0, 8);
  const averageBudget = trips.length
    ? Math.round(trips.reduce((sum, trip) => sum + trip.totalEstimatedCost, 0) / trips.length)
    : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 lg:px-6">
      <header className="mb-8 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Planner
          </Link>
        </Button>
        <Badge tone="outline">{source}</Badge>
      </header>

      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Trip memory</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal md:text-5xl">Past plans make the next one sharper.</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Triplet stores saved itineraries and preference signals: budget comfort, favorite categories, and traits to avoid.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4 shadow-soft">
              <CalendarDays className="mb-3 h-5 w-5 text-emerald-700" />
              <p className="text-2xl font-black">{trips.length}</p>
              <p className="text-sm text-muted-foreground">saved itineraries</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 shadow-soft">
              <WalletCards className="mb-3 h-5 w-5 text-emerald-700" />
              <p className="text-2xl font-black">{averageBudget ? formatMoney(averageBudget) : "$0"}</p>
              <p className="text-sm text-muted-foreground">average plan spend</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-bold">
              <BrainCircuit className="h-4 w-4 text-emerald-700" />
              Preference signals
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(vibes.length ? vibes : ["quiet", "walkable", "budget-aware"]).map((vibe) => (
                <Badge key={vibe}>{vibe}</Badge>
              ))}
            </div>
          </div>
        </div>

        <section className="space-y-4">
          {trips.length === 0 ? (
            <div className="rounded-lg border border-dashed border-emerald-300 bg-white/75 p-8 text-center">
              <p className="text-lg font-bold">No saved trips yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">Generate a plan, save it, and it will appear here.</p>
            </div>
          ) : (
            trips.map((trip) => (
              <article key={trip.id} className="rounded-lg border border-border bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black tracking-normal">{trip.title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {trip.city} · {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone="amber">{formatMoney(trip.totalEstimatedCost, trip.input.budget.currency)}</Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{trip.summary}</p>
                <div className="mt-4 grid gap-2">
                  {trip.stops.map((stop) => (
                    <div key={stop.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                      <span className="font-semibold">
                        {stop.order}. {stop.name}
                      </span>
                      <span className="text-muted-foreground">{stop.category}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
