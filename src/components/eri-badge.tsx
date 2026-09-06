"use client";

import { cn } from "@/lib/utils";

interface EriBadgeProps {
  eri: number;
  className?: string;
}

export function EriBadge({ eri, className }: EriBadgeProps) {
  const tone =
    eri >= 5
      ? "bg-emerald-50 text-emerald-700"
      : eri >= 2
        ? "bg-amber-50 text-amber-800"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone,
        className
      )}
    >
      {eri.toFixed(1)} score
    </span>
  );
}
