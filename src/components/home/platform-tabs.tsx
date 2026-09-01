"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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
        sub: "AI OVERVIEW · NOT PRESENT",
        state: "GAP",
        tint: "muted" as const,
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
    screenFoot: "2 issues need you",
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
        sub: "2 OF 3 ENGINES",
        state: "WATCH",
        tint: "muted" as const,
      },
    ],
  },
];

export function PlatformTabs() {
  const [tab, setTab] = useState(0);
  const active = modules[tab];

  return (
    <div className="border border-ink">
      <div
        role="tablist"
        aria-label="Platform modules"
        className="flex gap-px overflow-x-auto bg-ink"
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
                "flex min-w-[180px] flex-1 cursor-pointer flex-col gap-[7px] border-0 px-[18px] py-4 text-left font-mono text-[11px] tracking-[0.06em]",
                selected ? "bg-background text-foreground" : "bg-ink text-surface-muted"
              )}
            >
              <span
                className={cn(
                  "text-[9.5px] tracking-[0.14em]",
                  selected ? "text-primary" : "text-[#8C857A]"
                )}
              >
                {mod.n}
              </span>
              <span>{mod.short}</span>
            </button>
          );
        })}
      </div>

      <div
        id="platform-panel"
        role="tabpanel"
        aria-labelledby={`platform-tab-${active.n}`}
        className="grid grid-cols-1 gap-px border-t border-ink bg-border lg:grid-cols-[0.85fr_1.15fr]"
      >
        <div className="flex flex-col gap-4 bg-background px-[30px] py-[34px]">
          <h3 className="m-0 text-[21px] leading-[1.1] tracking-[-0.02em] lg:text-[30px]">
            {active.title}
          </h3>
          <p className="m-0 text-pretty text-[15.5px] leading-[1.6] text-ink-muted">
            {active.desc}
          </p>
          <div className="mt-1.5 flex flex-col gap-2.5">
            {active.bullets.map((bullet) => (
              <div
                key={bullet}
                className="grid grid-cols-[14px_1fr] items-start gap-2.5 text-[14.5px] leading-[1.5] text-[#2C2822]"
              >
                <span className="pt-0.5 font-mono text-xs text-primary">-</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto border-t border-border pt-5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
            {active.meta}
          </div>
        </div>

        <div className="bg-card px-7 py-[26px]">
          <div className="border border-[#D6D1C7] bg-white">
            <div className="flex justify-between border-b border-border px-3.5 py-[11px] font-mono text-[9.5px] tracking-[0.12em] text-muted-foreground">
              <span>{active.screen}</span>
              <span>{active.screenMeta}</span>
            </div>
            {active.rows.map((row) => (
              <div
                key={row.main}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#EFEBE4] p-3.5"
              >
                <div className="flex min-w-0 flex-col gap-[5px]">
                  <span className="text-sm leading-[1.4] text-foreground">{row.main}</span>
                  <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                    {row.sub}
                  </span>
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap font-mono text-[10px] tracking-[0.08em]",
                    row.tint === "accent" ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {row.state}
                </span>
              </div>
            ))}
            <div className="px-3.5 py-3 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
              <span className="text-primary">▍</span> {active.screenFoot}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-ink bg-ink px-5 py-[15px] font-mono text-[11px] tracking-[0.04em] text-surface-muted">
        <span className="text-primary">↺</span>
        <span>Engagement data feeds back into generation. Week four writes better hooks than week one.</span>
      </div>
    </div>
  );
}
