import { cn } from "@/lib/utils";

export interface TrendBadgeProps {
  value: number;
  suffix?: string;
  className?: string;
}

function formatMagnitude(value: number): string {
  const abs = Math.abs(value);
  return Number.isInteger(abs) ? String(abs) : String(abs);
}

export function TrendBadge({ value, suffix = "%", className }: TrendBadgeProps) {
  const amount = `${formatMagnitude(value)}${suffix}`;

  if (value === 0) {
    return (
      <span className={cn("text-xs font-medium tabular-nums text-muted-foreground", className)}>
        0{suffix}
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className={cn("text-xs font-medium tabular-nums text-emerald-700", className)}>
        +{amount}
      </span>
    );
  }

  return (
    <span className={cn("text-xs font-medium tabular-nums text-red-600", className)}>
      -{amount}
    </span>
  );
}
