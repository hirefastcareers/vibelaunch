import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "filled" | "soft" | "outline";

const TONE: Record<Tone, string> = {
  filled: "border-ink-muted bg-ink-muted text-background",
  soft: "border-surface-muted bg-surface-muted text-foreground",
  outline: "border-border bg-transparent text-muted-foreground",
};

export interface DataPillProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function DataPill({ children, tone = "outline", className }: DataPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
