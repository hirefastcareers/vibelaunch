# Xoopa Roadmap

Product direction: GEO/AI-citation-tracking tool — track whether a brand is mentioned/cited across major AI models, tied to a content-fix workflow. Targeting indie hackers and SaaS builders (fast audience growth priority over enterprise/local-business revenue for now).

## Phase 1 — Rename & scope strip [COMPLETE]
- Renamed Sorano → Xoopa across codebase
- Removed/flagged off X-growth-tool features: Smart Scheduler, Auto Retweet/DM/Delete, Engagement Growth Feed, Viral Discovery, ERI metric
- Kept: X OAuth/publish (as one distribution channel), AI content generation pipeline, shared data-viz components

## Phase 2 — Real citation tracking pipeline [NOT COMPLETE — precursor only as of 2026-09-10]
Status check (codebase audit, not marked COMPLETE): the Phase 2 shape below is **not** fully applied. A partial GEO path exists and must not be treated as the real pipeline.

**Target for this phase**
- New schema: TrackedQuery, CitationRun
- Model runners: OpenAI, Anthropic, Gemini, Perplexity, Grok (5 models)
- Brand mention detection via fuzzy matching
- QStash scheduled runs, 2x/week per tracked query
- Dashboard wiring using existing TrendChart/StatCard/TrendBadge/DataPill components
- Deferred from this phase: Microsoft Copilot (no public API), Meta Muse (no public API, launched Sept 2026 as closed consumer agent)

**What exists today (precursor — not enough for COMPLETE)**
- Schema: `GeoMetric` only — **no** `TrackedQuery` / `CitationRun` models (`prisma/schema.prisma`)
- Model runners: OpenAI (ChatGPT), Anthropic (Claude), Perplexity only — **no** Gemini or Grok (`src/lib/geo/citation-tracker.ts`, `src/lib/geo/llm-schema.ts`)
- Mention detection: exact substring match on name/domain — **not** fuzzy matching
- Scheduling: citation checks run on demand (e.g. Ship update / GEO recheck), not QStash 2x/week per tracked query
- Dashboard: `geo-card` uses StatCard / TrendChart (TrendBadge / DataPill available in UI kit)
- Honesty gap: on missing keys or failed HTTP, runners still fall back to `simulateResponse()` and persist rows as if live — see `docs/deferred-work.md` (2026-09-08 GEO silent simulate). No `isDemoMode()` gate found, but silent simulation is the same class of stub for core citation behavior

**Do not mark COMPLETE until:** TrackedQuery + CitationRun land, five model runners are wired and used, fuzzy matching is real, QStash 2x/week schedule runs, and citation results are never silently simulated without labeling.

## Phase 3 — Query library & onboarding UX [NOT STARTED]
- New user flow: enter brand name → get auto-generated/templated starter set of tracked prompts
- First-run experience is the priority — must not launch to a blank text box

## Phase 4 — Competitor comparison view [NOT STARTED]
- Track 2-3 competitor brands against the same query set
- Head-to-head share-of-voice view

## Phase 5 — Sentiment classification [NOT STARTED]
- Extra LLM call per citation run to tag mention as positive/neutral/negative
- Store on CitationRun.sentiment (field already exists in Phase 2 schema)

## Phase 6 — "Fix it" content loop [NOT STARTED]
- Connect a citation gap (query where brand wasn't mentioned) to a generated content suggestion via existing AI content pipeline
- This is the core differentiator vs. tracking-only competitors (Profound, Otterly, Peec AI, etc.)

## Phase 7 — Pricing/plan tiers [NOT STARTED]
- Define Free/Starter/Pro limits: query count, model count, run frequency
- Wire into existing DodoPayments planTier schema (already built for billing generally, needs Xoopa-specific limits)

## Phase 8 — Public marketing site [NOT STARTED]
- Landing page + pricing page
- Needed before launch to X/indie hacker audience

## Notes
- Follow existing honesty discipline: no phase is marked complete if it still relies on isDemoMode() stubs for its core function
- Log any newly discovered deferred work to docs/deferred-work.md as usual, cross-reference from here if it blocks a phase
- Related: `docs/deferred-work.md` (GEO silent simulate), `docs/wiring-checklist.md`, `docs/handover.md`, `docs/plan-2026-09-08.md`
