import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "amber" | "slate" | "outline";
};

export function Badge({ className, tone = "green", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold",
        tone === "green" && "bg-emerald-100 text-emerald-800",
        tone === "amber" && "bg-amber-100 text-amber-900",
        tone === "slate" && "bg-slate-100 text-slate-700",
        tone === "outline" && "border border-border bg-white text-foreground",
        className
      )}
      {...props}
    />
  );
}
