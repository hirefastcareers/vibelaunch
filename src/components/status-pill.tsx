import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "fail" | "neutral";

const TONE: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-800",
  fail: "bg-red-50 text-red-700",
  neutral: "bg-muted text-muted-foreground",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
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
    case "ok":
    case "active":
      return "Healthy";
    case "warning":
    case "warn":
      return "Needs attention";
    case "failed":
    case "fail":
      return "Failing";
    default:
      return status ? status.replaceAll("_", " ") : "Unknown";
  }
}
