"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const REINFORCE_PHASES = [
  { sub: "PUBLISHED 09:41", state: "SHIPPED", tint: "muted" as const },
  { sub: "ERI 1.4", state: "SHIPPED", tint: "muted" as const },
  { sub: "ERI 2.3", state: "SHIPPED", tint: "muted" as const },
  { sub: "ERI 2.3", state: "REINFORCED", tint: "accent" as const },
];

const PHASE_MS = [3500, 3500, 3500, 2000];
const SNAP = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

const modules = [
  {
    n: "01",
    short: "POSTS & HOOKS",
    title: "AI Post Generator & Hooks",
    desc: "Turn product updates into viral social posts that learn from what already worked.",
    bullets: [
      "Hooks drafted from your own best-performing posts, not a generic prompt",
      "Every draft scored before it queues, so weak posts never ship",
      "Reply threads and follow-ups planned with the original post",
    ],
    meta: "QSTASH QUEUE · APPROVE OR AUTOPILOT",
    screen: "POST QUEUE",
    screenMeta: "3 DRAFTS",
    screenFoot: "next slot 13:30",
    rows: [
      {
        main: '"We just shipped Playwright media capture..."',
        sub: "HOOK SCORE 0.81 · 214 CHARS",
        state: "QUEUED",
        tint: "accent" as const,
      },
      {
        main: '"Most indie tools die of no distribution."',
        sub: "HOOK SCORE 0.74 · THREAD 1/4",
        state: "DRAFT",
        tint: "muted" as const,
      },
      {
        main: '"Three weeks of changelog, zero manual posts."',
        sub: "HOOK SCORE 0.69 · 180 CHARS",
        state: "DRAFT",
        tint: "muted" as const,
      },
      {
        main: '"v1.3 is live - here is what changed."',
        sub: "PUBLISHED 09:41 · 42 LIKES",
        state: "SHIPPED",
        tint: "muted" as const,
      },
    ],
  },
  {
    n: "02",
    short: "ARTICLES & SEO",
    title: "Auto-Published Articles",
    desc: "Ship Google-ranked articles from the same updates, without a separate content workflow.",
    bullets: [
      "Changelog entries expand into static, indexable pages",
      "Internal links and metadata generated with the page",
      "Sitemap pinged and indexing requested on publish",
    ],
    meta: "STATIC PAGES · SITEMAP · SEARCH CONSOLE",
    screen: "PUBLISHED PAGES",
    screenMeta: "12 INDEXED",
    screenFoot: "crawl requested 10:02",
    rows: [
      {
        main: "/changelog/v1-4-media-capture",
        sub: "1,140 WORDS · 6 INTERNAL LINKS",
        state: "INDEXED",
        tint: "accent" as const,
      },
      {
        main: "/changelog/v1-3-post-scoring",
        sub: "980 WORDS · 4 INTERNAL LINKS",
        state: "INDEXED",
        tint: "accent" as const,
      },
      {
        main: "/blog/geo-for-indie-tools",
        sub: "1,620 WORDS · PILLAR PAGE",
        state: "CRAWLING",
        tint: "muted" as const,
      },
      {
        main: "/changelog/v1-2-queue",
        sub: "760 WORDS · 3 INTERNAL LINKS",
        state: "INDEXED",
        tint: "accent" as const,
      },
    ],
  },
  {
    n: "03",
    short: "AI SEARCH",
    title: "AI Search (ChatGPT / Perplexity)",
    desc: "Get recommended in ChatGPT and Perplexity when people ask for tools like yours.",
    bullets: [
      "Facts and comparisons structured the way engines quote sources",
      "Prompt set tracked weekly across three engines",
      "Every gap becomes a task with the page and fact to add",
    ],
    meta: "GEO · WEEKLY CITATION SWEEP",
    screen: "PROMPT SET",
    screenMeta: "240 PROMPTS",
    screenFoot: "next sweep monday 06:00",
    rows: [
      {
        main: '"best SEO automation for solo founders"',
        sub: "CHATGPT · POSITION 2",
        state: "CITED",
        tint: "accent" as const,
      },
      {
        main: '"tools to auto-post product updates to X"',
        sub: "PERPLEXITY · POSITION 4",
        state: "CITED",
        tint: "accent" as const,
      },
      {
        main: '"GEO tools for small SaaS"',
        sub: "CLAUDE · POSITION 3",
        state: "CITED",
        tint: "accent" as const,
      },
      {
        main: '"changelog SEO automation"',
        sub: "CHATGPT · POSITION 1",
        state: "CITED",
        tint: "accent" as const,
      },
    ],
  },
  {
    n: "04",
    short: "HEALTH & AUDITS",
    title: "App Health & Audits",
    desc: "See indexing, media, and AI-search citation checks in one place.",
    bullets: [
      "Indexing, sitemap and metadata coverage in a single report",
      "Playwright captures real screenshots of the screens you changed",
      "Failures surface as tasks, not as a dashboard you have to read",
    ],
    meta: "WEEKLY AUDIT · PLAYWRIGHT CAPTURE",
    screen: "HEALTH REPORT",
    screenMeta: "WEEK 34",
    screenFoot: "1 issue needs you",
    rows: [
      {
        main: "Indexing coverage",
        sub: "12 OF 12 PAGES",
        state: "PASS",
        tint: "accent" as const,
      },
      {
        main: "Open graph media",
        sub: "2 PAGES MISSING IMAGE",
        state: "FIX",
        tint: "muted" as const,
      },
      {
        main: "UI media freshness",
        sub: "CAPTURED 4H AGO",
        state: "PASS",
        tint: "accent" as const,
      },
      {
        main: "AI citation coverage",
        sub: "3 OF 3 ENGINES",
        state: "PASS",
        tint: "accent" as const,
      },
    ],
  },
];

function useReinforcementCycle(active: boolean) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }

    let step = 0;
    let elapsed = 0;
    const tick = 100;
    const id = setInterval(() => {
      elapsed += tick;
      if (elapsed >= PHASE_MS[step]) {
        elapsed = 0;
        step = (step + 1) % PHASE_MS.length;
        setPhase(step);
      }
    }, tick);

    return () => clearInterval(id);
  }, [active]);

  return REINFORCE_PHASES[phase];
}

export function PlatformTabs() {
  const [tab, setTab] = useState(0);
  const active = modules[tab];
  const reinforce = useReinforcementCycle(tab === 0);

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-card via-background to-card shadow-lg">
      <div className="border-b border-border px-4 py-4 md:px-6">
        <div
          role="tablist"
          aria-label="Platform modules"
          className="grid grid-cols-2 gap-2 lg:grid-cols-4"
        >
        {modules.map((mod, idx) => {
          const selected = idx === tab;
          return (
            <button
              key={mod.n}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`platform-tab-${mod.n}`}
              aria-controls="platform-panel"
              onClick={() => setTab(idx)}
              className={cn(
                "flex min-h-[92px] cursor-pointer flex-col justify-between rounded-2xl border px-4 py-4 text-left transition-all",
                selected
                  ? "border-transparent bg-foreground text-background shadow-md"
                  : "border-border bg-background text-foreground hover:border-foreground/10 hover:bg-card"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "text-[11px] font-medium tracking-[0.12em]",
                    selected ? "text-primary-foreground/80" : "text-primary"
                  )}
                >
                  {mod.n}
                </span>
                <span
                  className={cn(
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[11px] font-medium tracking-[0.12em]",
                    selected ? "bg-background/10 text-background/75" : "bg-muted text-muted-foreground"
                  )}
                >
                  {mod.screenMeta}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-80">
                  {mod.short}
                </div>
                <div className="mt-2 text-base font-medium tracking-[-0.02em]">
                  {mod.title}
                </div>
              </div>
            </button>
          );
        })}
        </div>
      </div>

      <div
        id="platform-panel"
        role="tabpanel"
        aria-labelledby={`platform-tab-${active.n}`}
        className="grid grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="flex flex-col gap-6 rounded-3xl border border-border bg-background p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-[11px] font-medium tracking-[0.08em] text-primary">
              {active.n}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {active.meta}
            </span>
          </div>
          <h3 className="m-0 text-[28px] leading-[1.05] tracking-[-0.03em] lg:text-[38px]">
            {active.title}
          </h3>
          <p className="m-0 max-w-[42ch] text-pretty text-[16px] leading-[1.7] text-muted-foreground">
            {active.desc}
          </p>
          <div className="grid gap-3">
            {active.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-[14.5px] leading-[1.6] text-foreground"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                  +
                </span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto grid grid-cols-3 gap-3 border-t border-border pt-6">
            <MetricChip label="Module" value={active.short.split(" & ")[0]} />
            <MetricChip label="Preview rows" value={String(active.rows.length)} />
            <MetricChip label="Status" value={active.screenFoot} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="overflow-hidden rounded-[24px] border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
              <span>{active.screen}</span>
              <span>{active.screenMeta}</span>
            </div>
            <div className="grid grid-cols-2 gap-px border-b border-border bg-border px-0 md:grid-cols-4">
              <PreviewStat label="Coverage" value={active.n === "03" ? "78%" : "94%"} />
              <PreviewStat label="Velocity" value={active.n === "01" ? "5 / wk" : active.n === "02" ? "3 / wk" : "Weekly"} />
              <PreviewStat label="Wins" value={active.n === "04" ? "12/12" : "24"} />
              <PreviewStat label="Trend" value={active.n === "03" ? "+14 pts" : "+22%"} accent />
            </div>
            <div className="p-3 md:p-4">
              {active.rows.map((row) => {
              const live = tab === 0 && row.state === "SHIPPED" ? reinforce : null;
              const sub = live?.sub ?? row.sub;
              const state = live?.state ?? row.state;
              const tint = live?.tint ?? row.tint;

              return (
                <div
                  key={row.main}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 mb-3 last:mb-0"
                >
                  <div className="flex min-w-0 flex-col gap-[5px]">
                    <span className="text-sm font-medium leading-[1.5] text-foreground">{row.main}</span>
                    {live ? (
                      <div className="relative h-[13px] overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={sub}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={SNAP}
                            className="absolute inset-0 text-[11px] font-medium tracking-[0.06em] text-muted-foreground"
                          >
                            {sub}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground">
                        {row.sub}
                      </span>
                    )}
                  </div>
                  {live ? (
                    <div className="relative h-[13px] min-w-[5.75rem] overflow-hidden text-right">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={state}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={SNAP}
                          className={cn(
                            "absolute inset-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.06em]",
                            tint === "accent"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {state}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium tracking-[0.06em]",
                        row.tint === "accent"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {row.state}
                    </span>
                  )}
                </div>
              );
            })}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                Live module preview
              </span>
              <span>{active.screenFoot}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-background px-5 py-4 text-[12px] tracking-[0.02em] text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span className="inline-flex items-center gap-2">
          <span className="text-primary">↺</span>
          Engagement data feeds back into generation. Week four writes better hooks than week one.
        </span>
        <span className="text-primary">Designed for operators, not just readers.</span>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background px-4 py-4">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-lg font-medium tracking-[-0.02em]", accent ? "text-primary" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
