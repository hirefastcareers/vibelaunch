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
  if (value === 0) {
    return (
      <span className={cn("font-mono text-[11px] text-muted-foreground", className)}>
        0{suffix}
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className={cn("font-mono text-[11px] text-accent", className)}>
        ▲ +{formatMagnitude(value)}
        {suffix}
      </span>
    );
  }

  return (
    <span className={cn("font-mono text-[11px] text-muted-foreground", className)}>
      ▼ -{formatMagnitude(value)}
      {suffix}
    </span>
  );
}
