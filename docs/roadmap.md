# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 1–12). Older “precursor only” notes on `main` are superseded once those PRs land.

**Roadmap status:** Phases 1–12 of the original GEO plan are built out on this review tip (Phase 9–12 land via parallel PRs merged here for integration review).

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
| **9** | **Public shareable AI visibility scorecard** | **Complete** (this tip) |
| **10** | **“Did the fix work” outcome loop** | **Complete** |
| **11** | **“Why wasn’t I cited” analysis** | **In review** |
| **12** | **Change alerts** (email/webhook) | **In review** |

## Phase 5 — Sentiment classification (complete)

**Status: Complete.**

- Lightweight OpenAI classifier (`gpt-4o-mini` via `OPENAI_SENTIMENT_MODEL`) runs only when `brandMentioned=true`; failures leave `sentiment` null (never invents neutral).
- Competitor mentions stored on `CitationCompetitorMention` with the same classifier + honesty rules.
- Dashboard Share + Compare tabs show positive / neutral / negative `DataPill` splits (per brand and per model).
- Historical backfill runs automatically via `/api/cron/backfill-sentiment` (hourly) and on citation-sweep cron — not a manual Tom step.
- TrendChart sentiment filter deferred (see `docs/deferred-work.md`).

## Phase 6 — “Fix it” content loop (complete)

- Gap detection: latest successful run `brandMentioned=false` **or** mention rate <50% over last 5 successful runs per (TrackedQuery, model); failed runs excluded.
- `ContentSuggestion` storage + OpenAI brief generation; honest errors, no placeholder briefs.
- Dashboard **Fixes** tab: list gaps, generate / dismiss / mark actioned / regenerate.
- Content suggestions use Phase 7 monthly quotas.

## Phase 7 — Pricing / plan tiers (complete)

- FREE £0: 5 prompts, OpenAI+Perplexity+Gemini, 1×/week (Mon), 1 competitor, 5 suggestions/mo (hard)
- STARTER £15/mo: 15 prompts, all 5 models, 1×/week (Mon), 3 competitors, 20 suggestions/mo (hard)
- PRO £39/mo: 25 prompts, all 5 models, 2×/week (Mon+Thu), 10 competitors, 75 suggestions/mo (**soft / fair-use**)
- Server-side enforcement: model allow-list in citation runner; weekday gate in cron fan-out; monthly suggestion quota
- **Pending Tom:** Dodo catalogue prices + env product IDs synced to £15/£39 display

## Phase 8 — Public marketing site (complete)

- `/` landing + `/pricing` from live plan config; honest social-proof placeholder; SEO (JSON-LD, sitemap, robots)
- **Still pending Tom:** env vars / Dodo catalogue sync; real testimonials once users exist

## Phase 9 — Public shareable AI visibility scorecard (complete)

**Status: Complete.**

- Public route `/score/[slug]` (no auth). Off by default; owner opts in from dashboard.
- Headline score 0–100 = equal-weight average of per-model mention rates on successful `CitationRun`s. Methodology documented on-page and in `docs/scorecard-methodology.md`.
- Numeric score withheld until ≥10 successful runs across ≥2 models (honest empty state otherwise).
- Privacy: never exposes prompts, raw responses, cited URL dumps, or account/billing fields. Competitor **names** + aggregate rates only for ranking.
- Share: dynamic OG image, Share on X, understated “Tracked with Xoopa” link home.
- Dashboard: `ScorecardSharePanel` (publish / unpublish / regenerate slug / preview). Unpublish 404s immediately.
- **Plan gating decision:** available on Free (`PLAN_LIMITS.*.publicScorecards = 1` for all tiers).

## Phase 10 — “Did the fix work” outcome loop (complete)

**Status: Complete.**

- `ContentSuggestion.publishedUrl` / `publishedAt` — user pastes the URL after marking a suggestion actioned.
- On each later successful `CitationRun`, match normalized published URL against `citedUrls`.
- `SuggestionOutcome` rows: EXACT | DOMAIN match types — never conflated.
- Fixes tab published outcomes with correlation ≠ causation caveat.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.
