# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 2–7). Older “precursor only” notes on `main` are superseded once those PRs land.

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Rename & scope strip / schema foundation | Complete |
| 2 | Live citation tracking (5 models) | Complete |
| 3 | Query library & onboarding | Complete |
| 4 | Competitor comparison | Complete |
| **5** | **Sentiment classification** on `CitationRun.sentiment` | **Complete** |
| **6** | **“Fix it” content loop** (gap → content suggestion) | **Complete** (this phase) |
| **7** | **Real per-tier commercial limits + polish** | **Complete** |
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
- Content suggestions now use Phase 7 monthly quotas (replaces the Phase 6 daily regen placeholder).

## Phase 7 — Pricing / plan tiers (complete)

**Status: Complete.**

- FREE £0: 5 prompts, OpenAI+Perplexity+Gemini, 1×/week (Mon), 1 competitor, 5 suggestions/mo (hard)
- STARTER £15/mo: 15 prompts, all 5 models, 1×/week (Mon), 3 competitors, 20 suggestions/mo (hard)
- PRO £39/mo: 25 prompts, all 5 models, 2×/week (Mon+Thu), 10 competitors, 75 suggestions/mo (**soft / fair-use**)
- Server-side enforcement: model allow-list in citation runner; weekday gate in cron fan-out; monthly suggestion quota (creates + regenerations)
- Cap hits return upgrade CTAs pointing at `/dashboard/billing`
- Dodo product IDs remain env-configured — Tom must set Dodo catalogue prices to £15/£39 to match display

## Phase 8 — Public marketing site (not started)

- Landing + pricing pages ahead of indie-hacker launch.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.
