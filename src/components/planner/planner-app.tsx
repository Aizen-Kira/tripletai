"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Clock3,
  History,
  Loader2,
  MapPin,
  Sparkles,
  TrainFront,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AgentProgressPanel, getDefaultAgentProgress } from "@/components/planner/agent-progress-panel";
import { BudgetTracker } from "@/components/planner/budget-tracker";
import { ItineraryTimeline } from "@/components/planner/itinerary-timeline";
import { MapPanel } from "@/components/planner/map-panel";
import { WhyNotPanel } from "@/components/planner/why-not-panel";
import type { AgentProgress, Itinerary, PlannerInput, Poi, RejectedPlace, StreamEvent, TransportMode } from "@/lib/types";

const defaultInput: PlannerInput = {
  vibe: "rainy Saturday, just me, want something artsy and low-key under $30",
  city: "New York",
  startingLocation: "SoHo",
  budget: { label: "Under $30", max: 30, currency: "USD" },
  duration: "half-day",
  transportMode: "walk",
  weather: "rainy",
  party: "solo",
  userId: process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user"
};

const budgetOptions = [
  { label: "Under $20", max: 20 },
  { label: "Under $30", max: 30 },
  { label: "Under $50", max: 50 },
  { label: "Flexible", max: 80 }
];

const vibeTags = ["Solo chill", "Rain-safe art", "Hidden cafes", "Street food", "No crowds"];

export function PlannerApp() {
  const [input, setInput] = useState<PlannerInput>(defaultInput);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [rejectedPlaces, setRejectedPlaces] = useState<RejectedPlace[]>([]);
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>(getDefaultAgentProgress());
  const [status, setStatus] = useState("Ready to plan locally.");
  const [narrative, setNarrative] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const budget = useMemo(
    () => budgetOptions.find((option) => option.max === input.budget.max) || budgetOptions[1],
    [input.budget.max]
  );

  useEffect(() => {
    const stored = localStorage.getItem("triplet:last-itinerary");
    if (stored && !itinerary) {
      try {
        setItinerary(JSON.parse(stored) as Itinerary);
      } catch {
        localStorage.removeItem("triplet:last-itinerary");
      }
    }
  }, [itinerary]);

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setNarrative("");
    setSaveStatus(null);
    setRejectedPlaces([]);
    setAgentProgress(getDefaultAgentProgress());
    setStatus("Starting Triplet...");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });

      if (!response.ok || !response.body) {
        throw new Error("Planner route did not return a stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          handleStreamEvent(JSON.parse(line) as StreamEvent);
        }
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate a plan.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleStreamEvent(event: StreamEvent) {
    if (event.type === "status") {
      setStatus(event.message);
    }

    if (event.type === "agent") {
      setAgentProgress((current) =>
        current.map((item) => (item.name === event.progress.name ? event.progress : item))
      );
    }

    if (event.type === "pois") {
      setPois(event.pois);
    }

    if (event.type === "ranked") {
      setRejectedPlaces(event.rejectedPlaces);
    }

    if (event.type === "token") {
      setNarrative((current) => current + event.text);
    }

    if (event.type === "itinerary") {
      setItinerary(event.itinerary);
      setRejectedPlaces(event.itinerary.rejectedPlaces);
      localStorage.setItem("triplet:last-itinerary", JSON.stringify(event.itinerary));
      setStatus("Plan ready.");
    }

    if (event.type === "error") {
      setStatus(event.message);
    }
  }

  async function saveItinerary() {
    if (!itinerary) return;
    setSaveStatus("Saving...");
    localStorage.setItem("triplet:last-itinerary", JSON.stringify(itinerary));
    const saved = JSON.parse(localStorage.getItem("triplet:saved-itineraries") || "[]") as Itinerary[];
    const next = [itinerary, ...saved.filter((trip) => trip.id !== itinerary.id)].slice(0, 12);
    localStorage.setItem("triplet:saved-itineraries", JSON.stringify(next));

    try {
      const response = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary })
      });
      const result = (await response.json()) as { persisted?: boolean };
      setSaveStatus(result.persisted ? "Saved to DynamoDB." : "Saved locally. Add DynamoDB env vars for cloud memory.");
    } catch {
      setSaveStatus("Saved locally. Cloud save was unavailable.");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 lg:grid-cols-[390px_minmax(0,1fr)_380px] lg:px-6">
      <aside className="space-y-4">
        <form onSubmit={submitPlan} className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-700">Plan input</p>
              <h2 className="text-xl font-black tracking-normal">What is today&apos;s vibe?</h2>
            </div>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>

          <label className="block space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Mood / vibe
            <Textarea
              value={input.vibe}
              onChange={(event) => setInput({ ...input, vibe: event.target.value })}
              placeholder="rainy afternoon, artsy, no crowds..."
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="block space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              City
              <span className="relative block">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input.city}
                  onChange={(event) => setInput({ ...input, city: event.target.value })}
                  className="pl-9"
                />
              </span>
            </label>

            <label className="block space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Starting point
              <span className="relative block">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input.startingLocation}
                  onChange={(event) => setInput({ ...input, startingLocation: event.target.value })}
                  className="pl-9"
                />
              </span>
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Select
              label="Budget"
              value={String(budget.max)}
              onChange={(event) => {
                const selected = budgetOptions.find((option) => option.max === Number(event.target.value)) || budgetOptions[1];
                setInput({
                  ...input,
                  budget: { label: selected.label, max: selected.max, currency: "USD" }
                });
              }}
            >
              {budgetOptions.map((option) => (
                <option key={option.max} value={option.max}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              label="How long?"
              value={input.duration}
              onChange={(event) => setInput({ ...input, duration: event.target.value as PlannerInput["duration"] })}
            >
              <option value="2-3 hours">2-3 hours</option>
              <option value="half-day">Half day</option>
              <option value="full-day">Full day</option>
            </Select>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {(["walk", "transit", "bike", "drive"] as TransportMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInput({ ...input, transportMode: mode })}
                className={`rounded-md border px-2 py-3 text-xs font-bold capitalize transition ${
                  input.transportMode === mode
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button className="mt-5 h-12 w-full text-base" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Plan my outing
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {vibeTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setInput({ ...input, vibe: `${input.vibe}, ${tag.toLowerCase()}` })}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {tag}
            </button>
          ))}
        </div>

        <BudgetTracker itinerary={itinerary} maxBudget={input.budget.max} currency={input.budget.currency} />
        <AgentProgressPanel progress={agentProgress} />
      </aside>

      <main className="space-y-5">
        <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{input.budget.label}</Badge>
              <Badge tone="slate">{input.transportMode} friendly</Badge>
              <Badge tone="amber">Local only</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-700" /> : <Clock3 className="h-4 w-4" />}
              {status}
            </div>
          </div>
          <p className="mt-4 min-h-12 text-base leading-7 text-muted-foreground">
            {narrative || "Triplet explains the route as it streams, then locks the final plan into cards and map markers."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={saveItinerary} disabled={!itinerary}>
              <Bookmark className="h-4 w-4" />
              Save itinerary
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/saved">
                <History className="h-4 w-4" />
                Past trips
              </Link>
            </Button>
            {saveStatus ? <span className="self-center text-sm font-semibold text-emerald-700">{saveStatus}</span> : null}
          </div>
        </section>

        <ItineraryTimeline itinerary={itinerary} isLoading={isLoading} />
        <WhyNotPanel rejectedPlaces={itinerary?.rejectedPlaces || rejectedPlaces} />
      </main>

      <aside className="space-y-4">
        <MapPanel itinerary={itinerary} pois={pois} />
        <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-bold">
            <TrainFront className="h-4 w-4 text-emerald-700" />
            Transparent ranking
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {(itinerary?.reasoning || [
              "Budget, weather fit, distance, opening hours, and vibe are scored before AI ranks the final route.",
              "Saved preferences are included as a signal, never as a hidden decision."
            ]).map((reason) => (
              <li key={reason} className="border-l-2 border-emerald-200 pl-3">
                {reason}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
