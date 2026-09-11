# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 1–12). Older “precursor only” notes on `main` are superseded once those PRs land.

**Roadmap status:** Phases 1–12 of the original GEO plan are present on this review tip.

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Rename & scope strip / schema foundation | Complete |
| 2 | Live citation tracking (5 models) | Complete |
| 3 | Query library & onboarding | Complete |
| 4 | Competitor comparison | Complete |
| **5** | **Sentiment classification** | **Complete** |
| **6** | **“Fix it” content loop** | **Complete** |
| **7** | **Real per-tier commercial limits** | **Complete** |
| **8** | **Public marketing site** | **Complete** |
| **9** | **Public shareable AI visibility scorecard** | **Complete** |
| **10** | **“Did the fix work” outcome loop** | **Complete** |
| **11** | **“Why wasn’t I cited” analysis** | **Complete** |
| **12** | **Change alerts** (email/webhook) | **In review** |

## Phase 9 — Public scorecard (complete)

- Public `/score/[slug]` (no auth). Off by default; owner opts in.
- Score 0–100 = equal-weight per-model mention rates; methodology on-page.
- Numeric score withheld until ≥10 successful runs across ≥2 models.
- Privacy: no prompts, raw responses, cited URL dumps, or billing fields.
- Available on Free (`publicScorecards = 1` all tiers).

## Phase 10 — “Did the fix work” (complete)

- Published URL on content suggestions; match against later `citedUrls`.
- EXACT vs DOMAIN outcomes; correlation ≠ causation caveat in UI.

## Phase 11 — “Why wasn’t I cited” (complete)

- Domain aggregation from missed-run `citedUrls`.
- On-demand gap analysis with robots-aware fetches + cache.
- Shares suggestion quota with Phase 6 generations.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.
