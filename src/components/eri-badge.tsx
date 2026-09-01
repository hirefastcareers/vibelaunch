"use client";

import { Badge } from "@/components/ui/badge";
import { getEriTier } from "@/lib/utils";
import { cn } from "@/lib/utils";

const tierVariants: Record<string, "viral" | "solid" | "baseline" | "low"> = {
  "high-viral": "viral",
  solid: "solid",
  baseline: "baseline",
  low: "low",
};

interface EriBadgeProps {
  eri: number;
  className?: string;
}

export function EriBadge({ eri, className }: EriBadgeProps) {
  const tier = getEriTier(eri);
  return (
    <Badge variant={tierVariants[tier]} className={cn("font-mono", className)}>
      Virality {eri.toFixed(1)}
    </Badge>
  );
}
