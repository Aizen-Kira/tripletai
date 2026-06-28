"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ className, label, children, ...props }: SelectProps) {
  return (
    <label className="block space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {label ? <span>{label}</span> : null}
      <span className="relative block">
        <select
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input bg-white px-3 pr-10 text-sm font-medium normal-case tracking-normal text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );
}
