"use client";

import { cn } from "@/lib/utils";

export interface SegmentedTabOption {
  value: string;
  label: string;
}

export interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedTabs({ options, value, onChange, className }: SegmentedTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex overflow-hidden rounded-sm border border-border bg-transparent",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "bg-ink text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
