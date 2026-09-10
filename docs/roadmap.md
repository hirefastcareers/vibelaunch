# Xoopa GEO roadmap

Product phases for citation tracking / generative engine optimization on Xoopa.
Status reflects what has shipped to `main` (or is complete on the active PR for the current phase).

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Schema + foundation for citation tracking | Complete |
| 2 | Live citation tracking (5 models) | Complete |
| 3 | Query library & onboarding | Complete |
| 4 | Competitor comparison | Complete |
| **5** | **Sentiment classification** on `CitationRun.sentiment` | **NOT STARTED — next** |
| **6** | **“Fix it” content loop** (gap → content suggestion) | **Complete** (this phase) |
| 7 | Real per-tier commercial limits + polish | Not started |

## Phase 5 (next) — Sentiment classification

**Status: NOT STARTED.** Do not skip or silently drop this phase.

- Classify sentiment on successful `CitationRun` rows (`CitationRun.sentiment` column already exists; always null today).
- Surface sentiment in dashboard analytics without inventing values when classification fails.
- Remains explicitly next after Phase 6.

## Phase 6 — “Fix it” content loop (complete)

Shipped in this pass:

- Gap detection: latest successful run `brandMentioned=false` **or** mention rate &lt;50% over last 5 successful runs per (TrackedQuery, model); failed runs excluded.
- `ContentSuggestion` storage + OpenAI brief generation (same chat path as Phase 3 prompt generation); honest errors, no placeholder briefs.
- Dashboard **Fixes** tab: list gaps, generate / dismiss / mark actioned / regenerate.
- Placeholder regen cap: 3 regenerations / suggestion / UTC day (`PLAN_LIMITS.suggestionRegensPerDay`); real tiered limits deferred to Phase 7.
