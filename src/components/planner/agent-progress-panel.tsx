"use client";

import { Check, Loader2, Minus, X } from "lucide-react";
import type { AgentName, AgentProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultProgress: AgentProgress[] = [
  { name: "intent", label: "Intent Extractor", status: "waiting", message: "Waiting" },
  { name: "weather", label: "Weather Agent", status: "waiting", message: "Waiting" },
  { name: "budget", label: "Budget Agent", status: "waiting", message: "Waiting" },
  { name: "places", label: "Places Agent", status: "waiting", message: "Waiting" },
  { name: "ranking", label: "Ranking Agent", status: "waiting", message: "Waiting" },
  { name: "reasoning", label: "Reasoning Agent", status: "waiting", message: "Waiting" },
  { name: "timeline", label: "Timeline Builder", status: "waiting", message: "Waiting" }
];

type AgentProgressPanelProps = {
  progress: AgentProgress[];
};

export function getDefaultAgentProgress() {
  return defaultProgress;
}

export function AgentProgressPanel({ progress }: AgentProgressPanelProps) {
  const merged = defaultProgress.map((item) => progress.find((progressItem) => progressItem.name === item.name) || item);

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Agent progress</p>
          <p className="text-xs text-muted-foreground">Each planning stage streams independently.</p>
        </div>
        <span className="text-xs font-semibold text-emerald-700">
          {merged.filter((item) => item.status === "complete").length}/{merged.length}
        </span>
      </div>
      <div className="space-y-2">
        {merged.map((item) => (
          <div
            key={item.name}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2 transition",
              item.status === "complete" && "border-emerald-200 bg-emerald-50",
              item.status === "running" && "border-amber-200 bg-amber-50",
              item.status === "error" && "border-red-200 bg-red-50",
              item.status === "waiting" && "border-border bg-white"
            )}
          >
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.label}</p>
              <p className="truncate text-xs text-muted-foreground">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusIcon({ status }: { status: AgentProgress["status"]; name?: AgentName }) {
  if (status === "complete") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Check className="h-4 w-4" />
      </span>
    );
  }

  if (status === "running") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
        <X className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Minus className="h-4 w-4" />
    </span>
  );
}
