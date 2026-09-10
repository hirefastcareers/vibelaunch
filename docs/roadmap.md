# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 2–6). Older “precursor only” notes on `main` are superseded once those PRs land.

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Rename & scope strip / schema foundation | Complete |
| 2 | Live citation tracking (5 models) | Complete |
| 3 | Query library & onboarding | Complete |
| 4 | Competitor comparison | Complete |
| **5** | **Sentiment classification** on `CitationRun.sentiment` | **Complete** |
| **6** | **“Fix it” content loop** (gap → content suggestion) | **Complete** (this phase) |
| 7 | Real per-tier commercial limits + polish | Not started |
| 8 | Public marketing site | Not started |

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
- Placeholder regen cap: 3 regenerations / suggestion / UTC day (`PLAN_LIMITS.suggestionRegensPerDay`); real tiered limits deferred to Phase 7.

## Phase 7 — Pricing / plan tiers (not started)

- Define Free / Starter / Pro limits for tracked queries, competitors, suggestion regenerations, model count, run frequency.
- Replace placeholder caps logged in `docs/deferred-work.md`.

## Phase 8 — Public marketing site (not started)

- Landing + pricing pages ahead of indie-hacker launch.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.
