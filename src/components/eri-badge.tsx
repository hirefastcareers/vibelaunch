"use client";

import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";

interface EriBadgeProps {
  eri: number;
  className?: string;
}

export function EriBadge({ eri, className }: EriBadgeProps) {
  const tone = eri >= 5 ? "ok" : eri >= 2 ? "warn" : "fail";
  return (
    <StatusPill tone={tone} className={cn(className)}>
      {`[VIRALITY: ${eri.toFixed(1)}]`}
    </StatusPill>
  );
}
