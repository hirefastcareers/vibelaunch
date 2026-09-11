# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 2–9). Older “precursor only” notes on `main` are superseded once those PRs land.

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
| **9** | **Public shareable AI visibility scorecard** | **Complete** |
| **10** | **“Did the fix work” loop** | **Not started** |
| **11** | **“Why wasn’t I cited” analysis** | **Not started** |
| **12** | **Change alerts** (email/webhook) | **Not started** |

## Phase 8 — Public marketing site (complete)

**Status: Complete.**

- `/` landing + `/pricing` from live plan config; honest social-proof placeholder; SEO (JSON-LD, sitemap, robots)
- **Still pending Tom (not blocking):** env vars / Dodo catalogue sync from Phase 7; real testimonials once users exist

## Phase 9 — Public shareable AI visibility scorecard (complete)

**Status: Complete.**

- Public route `/score/[slug]` (no auth). Off by default; owner opts in from dashboard.
- Headline score 0–100 = equal-weight average of per-model mention rates on successful `CitationRun`s. Methodology documented on-page and in `docs/scorecard-methodology.md`.
- Numeric score withheld until ≥10 successful runs across ≥2 models (honest empty state otherwise).
- Privacy: never exposes prompts, raw responses, cited URL dumps, or account/billing fields. Competitor **names** + aggregate rates only for ranking.
- Share: dynamic OG image, Share on X, understated “Tracked with Xoopa” link home.
- Dashboard: `ScorecardSharePanel` (publish / unpublish / regenerate slug / preview). Unpublish 404s immediately (`force-dynamic`, live slug lookup).
- **Plan gating decision:** available on Free (`PLAN_LIMITS.*.publicScorecards = 1` for all tiers). Gating the growth loop would defeat the purpose; flag in PR.

## Phase 10 — “Did the fix work” loop (not started)

Let users mark a Phase 6 content suggestion as published with a URL, then flag when that URL appears in `CitationRun.citedUrls` on later runs. Closes gap → fix → measured outcome.

## Phase 11 — “Why wasn’t I cited” analysis (not started)

For missed queries, surface which domains *did* get cited (data already in `CitationRun.citedUrls`) and what they cover that the user doesn’t.

## Phase 12 — Change alerts (not started)

Email/webhook when a citation is lost, regained, or a competitor overtakes the user. Reuse existing QStash cron infrastructure.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.
