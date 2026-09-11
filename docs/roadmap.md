# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 2–10). Older “precursor only” notes on `main` are superseded once those PRs land.

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Rename & scope strip / schema foundation | Complete |
| 2 | Live citation tracking (5 models) | Complete |
| 3 | Query library & onboarding | Complete |
| 4 | Competitor comparison | Complete |
| **5** | **Sentiment classification** on `CitationRun.sentiment` | **Complete** |
| **6** | **“Fix it” content loop** (gap → content suggestion) | **Complete** |
| **7** | **Real per-tier commercial limits + polish** | **Complete** |
| **8** | **Public marketing site** (landing + pricing + SEO) | **Complete** |
| **9** | **Public scorecard** | Not started on this lineage tip (may ship on parallel PR) |
| **10** | **“Did the fix work” outcome loop** | **Complete** |
| 11 | — | Not started |
| 12 | — | Not started |

## Phase 5 — Sentiment classification (complete)

**Status: Complete.**

- Lightweight OpenAI classifier (`gpt-4o-mini` via `OPENAI_SENTIMENT_MODEL`) runs only when `brandMentioned=true`; failures leave `sentiment` null (never invents neutral).
- Competitor mentions stored on `CitationCompetitorMention` with the same classifier + honesty rules.
- Dashboard Share + Compare tabs show positive / neutral / negative `DataPill` splits (per brand and per model).
- Historical backfill runs automatically via `/api/cron/backfill-sentiment` (hourly) and on citation-sweep cron — not a manual Tom step. SQL migrations cannot call OpenAI, so the cron is the ship-time backfill path.
- TrendChart sentiment filter deferred (see `docs/deferred-work.md`).

## Phase 6 — “Fix it” content loop (complete)

Shipped in this pass:

- Gap detection: latest successful run `brandMentioned=false` **or** mention rate &lt;50% over last 5 successful runs per (TrackedQuery, model); failed runs excluded.
- `ContentSuggestion` storage + OpenAI brief generation (same chat path as Phase 3 prompt generation); honest errors, no placeholder briefs.
- Dashboard **Fixes** tab: list gaps, generate / dismiss / mark actioned / regenerate.
- Content suggestions now use Phase 7 monthly quotas (replaces the Phase 6 daily regen placeholder).

## Phase 7 — Pricing / plan tiers (complete)

**Status: Complete.**

- FREE £0: 5 prompts, OpenAI+Perplexity+Gemini, 1×/week (Mon), 1 competitor, 5 suggestions/mo (hard)
- STARTER £15/mo: 15 prompts, all 5 models, 1×/week (Mon), 3 competitors, 20 suggestions/mo (hard)
- PRO £39/mo: 25 prompts, all 5 models, 2×/week (Mon+Thu), 10 competitors, 75 suggestions/mo (**soft / fair-use**)
- Server-side enforcement: model allow-list in citation runner; weekday gate in cron fan-out; monthly suggestion quota (creates + regenerations)
- Cap hits return upgrade CTAs pointing at `/dashboard/billing`
- **Pending Tom (not blocking Phase 7 or 8):** Dodo catalogue prices + env product IDs (`DODO_STARTER_PRODUCT_ID` / `DODO_PRO_PRODUCT_ID`) synced to £15/£39 display

## Phase 8 — Public marketing site (complete)

**Status: Complete.**

- `/` landing: positioning for indie hackers / SaaS builders; feature sections (5-model tracking, competitor SoV, sentiment); fix-it loop with visual weight; honest empty social-proof placeholder (no fake testimonials/stats); CTAs → signup (`/auth/signin`)
- `/pricing`: Free / Starter / Pro cards + comparison table driven by `PLAN_LIMITS` / `PLAN_DISPLAY` (no duplicated hardcodes that can drift); FAQ + FAQPage JSON-LD
- SEO: page meta / OG / Twitter / canonicals; Organization + SoftwareApplication offers from real plan config; dynamic `sitemap.ts` with extensible `marketingPages` list; production-aware `robots.ts`
- Reuses design-system tokens + `IconFeatureCard` / `SegmentedTabs`
- **Still pending Tom (not blocking):** env vars / Dodo catalogue sync from Phase 7; real testimonials once users exist

## Phase 10 — “Did the fix work” outcome loop (complete)

**Status: Complete.**

- `ContentSuggestion.publishedUrl` / `publishedAt` — user pastes the URL after marking a suggestion actioned; saved URL is normalized (https, strip `www`, trailing slash, tracking params).
- On each later successful `CitationRun` for that `TrackedQuery`, match normalized published URL against `citedUrls`.
- `SuggestionOutcome` rows: one per detected citation (`contentSuggestionId`, `citationRunId`, `matchedAt`, `model`, `matchType` EXACT | DOMAIN). Exact (host+path) and domain-only are separate signals — never conflated.
- Fixes tab **Published outcomes**: status per suggestion — needs URL / published awaiting data / cited (models + when) / not yet cited after 3 successful post-publish runs. Copy states that slow indexing means “not yet” is not failure.
- Aggregate “published fixes that earned exact citations” only after ≥3 published fixes have cleared the 3-run observation window.
- In-product caveat: correlation ≠ causation; not presented as ROI proof.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.
