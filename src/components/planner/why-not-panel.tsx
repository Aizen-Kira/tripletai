"use client";

import { XCircle } from "lucide-react";
import type { RejectedPlace } from "@/lib/types";

type WhyNotPanelProps = {
  rejectedPlaces: RejectedPlace[];
};

export function WhyNotPanel({ rejectedPlaces }: WhyNotPanelProps) {
  if (rejectedPlaces.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Why not</p>
        <h2 className="mt-1 text-xl font-black tracking-normal">Rejected alternatives</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rejectedPlaces.map((place) => (
          <article key={place.id} className="rounded-md border border-border bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{place.name}</h3>
                  <span className="text-xs font-semibold text-muted-foreground">{place.score}% fit</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{place.category}</p>
                <p className="mt-3 text-sm leading-6">{place.reason}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
