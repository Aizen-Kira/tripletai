"use client";

import { WalletCards } from "lucide-react";
import type { Itinerary } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type BudgetTrackerProps = {
  itinerary: Itinerary | null;
  maxBudget: number;
  currency: string;
};

export function BudgetTracker({ itinerary, maxBudget, currency }: BudgetTrackerProps) {
  const spent = itinerary?.totalEstimatedCost || 0;
  const percent = Math.min((spent / Math.max(maxBudget, 1)) * 100, 100);
  const remaining = Math.max(maxBudget - spent, 0);

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <WalletCards className="h-4 w-4 text-emerald-700" />
          Budget tracker
        </div>
        <span className="text-sm text-muted-foreground">
          {formatMoney(spent, currency)} / {formatMoney(maxBudget, currency)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {itinerary
          ? `${formatMoney(remaining, currency)} buffer left for a snack, tip, or ride home.`
          : "Triplet keeps the whole route under your target before it recommends a stop."}
      </p>
    </section>
  );
}
