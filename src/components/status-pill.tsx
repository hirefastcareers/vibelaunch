import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "fail" | "neutral";

const TONE: Record<Tone, string> = {
  ok: "border-primary text-primary",
  warn: "border-stone-800 text-muted-foreground",
  fail: "border-stone-800 text-muted-foreground",
  neutral: "border-stone-800 text-muted-foreground",
};

interface StatusPillProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function StatusPill({ children, tone = "neutral", className }: StatusPillProps) {
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

export function statusTone(status: string): Tone {
  if (status === "passed" || status === "ok" || status === "active") return "ok";
  if (status === "warning" || status === "warn") return "warn";
  if (status === "failed" || status === "fail") return "fail";
  return "neutral";
}

export function statusLabel(status: string): string {
  switch (status) {
    case "passed":
      return "[SYS_OK]";
    case "warning":
      return "[WARN]";
    case "failed":
      return "[FAIL]";
    default:
      return `[${status.toUpperCase()}]`;
  }
}
