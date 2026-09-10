"use client";

import { useState } from "react";
import { ArrowRight, FileText, Radar, Sparkles } from "lucide-react";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

const STEPS = [
  {
    value: "detect",
    label: "Detect",
    icon: Radar,
    title: "Find the gaps",
    body: "When a prompt’s latest successful run misses your brand — or your mention rate dips below 50% over the last five successful runs — Xoopa surfaces a gap. Failed API runs don’t count as misses.",
  },
  {
    value: "brief",
    label: "Brief",
    icon: Sparkles,
    title: "Generate a content brief",
    body: "One click drafts a citeable brief aimed at the gap: angle, outline, and what to publish so the next sweep has something real to recommend.",
  },
  {
    value: "ship",
    label: "Ship",
    icon: FileText,
    title: "Close the loop",
    body: "Mark the suggestion actioned when you’ve shipped. The next citation sweep tells you whether the fix moved the needle — measurement tied to content, not vanity scores.",
  },
] as const;

export function FixItShowcase() {
  const [step, setStep] = useState<string>(STEPS[0].value);
  const active = STEPS.find((s) => s.value === step) ?? STEPS[0];
  const Icon = active.icon;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-6 border-b border-border bg-gradient-to-br from-primary/[0.06] via-card to-muted/40 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="max-w-xl">
          <p className="ds-kicker">The differentiator</p>
          <h3 className="mt-2 font-serif text-[28px] leading-[1.1] tracking-[-0.02em] md:text-[34px]">
            Scorekeeping is not the product. The fix is.
          </h3>
        </div>
        <SegmentedTabs
          options={STEPS.map((s) => ({ value: s.value, label: s.label }))}
          value={step}
          onChange={setStep}
          className="shrink-0 self-start"
        />
      </div>

      <div
        key={active.value}
        className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8 transition-opacity duration-300"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Step {STEPS.findIndex((s) => s.value === active.value) + 1} of {STEPS.length}
          </p>
          <h4 className="mt-2 text-xl font-medium tracking-tight">{active.title}</h4>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {active.body}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground">
            Track → gap → brief → ship → re-check
            <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
          </p>
        </div>
      </div>
    </div>
  );
}
