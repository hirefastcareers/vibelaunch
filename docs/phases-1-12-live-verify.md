# Phases 1–12 live verification report

Date: **2026-09-11** (updated after production DB baseline + GEO migrate).

**Rule:** nothing is marked verified unless it was actually executed.

Production: `https://vibelaunch-nu.vercel.app` (`main`).  
PR #39 preview (Phases 9–12 UI/API): `https://xoopa-ptzqole8j-hirefastcareers-projects.vercel.app`.  
DB baseline procedure: `docs/db-baseline.md`.

---

## Critical finding — resolved

Previously the shared Vercel Supabase DB lacked GEO tables and `_prisma_migrations`.

**Executed fix (staging first, then production):**

1. Local staging clone from introspected pre-GEO schema + copied rows
2. Marked migrations `…120000` and `…153000` as already applied
3. `prisma migrate deploy` applied the remaining 10 GEO migrations
4. Same sequence on production; `migrate diff` empty afterward
5. Existing user/project row counts unchanged

Production now has TrackedQuery, CitationRun, CompetitorBrand, ContentSuggestion,
SuggestionOutcome, CitationGapAnalysis, Alert*, scorecard columns, `_prisma_migrations`.

---

## 1. Vitest + migration

| Check | Executed? | Result |
|-------|-----------|--------|
| Vitest (review tip, earlier) | Yes | 195/195 |
| Fresh empty `migrate deploy` | Yes (local) | Still fails without foundation baseline (expected) |
| Staging baseline + GEO migrate | **Yes** | Clean; 12/12 recorded |
| Production baseline + GEO migrate | **Yes** | Clean; schema matches `prisma/schema.prisma` |

---

## 2. Plan-tier enforcement (live HTTP after migrate)

| Check | Executed? | Result |
|-------|-----------|--------|
| Free tracked prompt over 5 | **Yes (prod)** | **403** `TRACKED_QUERY_LIMIT` |
| Free competitor over 1 | **Yes (prod)** | **403** `COMPETITOR_LIMIT` |
| Free suggestion over 5/mo | **Yes (prod)** | **403** `SUGGESTION_LIMIT` |
| Free project over 1 | **Yes (prod)** | first **201**, second **403** `PROJECT_LIMIT` |
| Starter tracked prompt over 15 | **Yes (prod)** | **403** `TRACKED_QUERY_LIMIT` |
| Starter competitor over 3 | **Yes (prod)** | **403** `COMPETITOR_LIMIT` |
| Model/schedule helpers | Yes (local earlier) | Free=3 models Mon-only; Pro=5 Mon+Thu |

---

## 3. Public scorecard (PR #39 preview)

| Check | Executed? | Result |
|-------|-----------|--------|
| Publish (`PATCH /api/geo/scorecard` public:true) | **Yes (preview)** | **200**, slug `xoopa-2ctwmu` |
| Unauthenticated `GET /score/{slug}` | **Yes (preview)** | **200**; no prompt list / rawResponse / billing fields in HTML |
| Unpublish then fetch | **Yes (preview)** | unpublish **200**; public URL **404** |
| On production `main` | N/A | Phase 9 routes not shipped on `main` yet |

---

## 4. Webhook safety (PR #39 preview)

| Check | Executed? | Result |
|-------|-----------|--------|
| Starter `PATCH /api/alerts` → `http://127.0.0.1/hook` | **Yes** | **400** private network |
| Starter → `http://169.254.169.254/...` | **Yes** | **400** private network |
| Free → public https webhook | **Yes** | **403** `WEBHOOK_PLAN_GATE` |
| DNS rebinding | No | Still deferred |

---

## 5. Cron auth

| Check | Executed? | Result |
|-------|-----------|--------|
| Prod / preview missing or invalid bearer | **Yes** | **401** |
| Authorized Vercel Cron | Earlier logs | Reached handlers (previously failed on missing tables) |

---

## 6. Live AI pipeline smoke (production)

Triggered `POST /api/geo/tracked-queries` with `runNow:true` for a PRO test user (main still allows weekday bypass).

| Model | Result |
|-------|--------|
| openai | **ok** — CitationRun stored, 6 citedUrls, brandMentioned=false (sentiment correctly null) |
| anthropic | **error** — API key not workspace-scoped |
| gemini | **error** — `GEMINI_API_KEY` not configured |
| perplexity | **error** — Sonar Agent API migration required (403) |
| grok | **error** — `XAI_API_KEY` not configured |

- **5 CitationRun rows** written; failures stored as `error` (not demo stubs); `isDemoMode()` did not invent metrics.
- **Observed cost:** no invoice line available to this agent. Only OpenAI succeeded; list-price ballpark for one search-grounded `gpt-4o-mini` call remains ~$0.01–0.05 — **not** invoice-verified.
- Full 5-model green path still blocked on provider config / Perplexity API migration.

---

## Still open / needs Tom

1. Configure Gemini + xAI keys; fix Anthropic workspace-scoped key; migrate Perplexity client to Agent `/v1/responses`
2. Merge PR #39 (scorecard/alerts UI) to `main` so production serves Phase 9–12 routes
3. DNS rebinding hardening; Dodo checkout; email provider; subjective UI/copy
4. Re-run 5-model smoke on a Mon/Thu after keys fixed; capture real invoice $ 

---

## Artifacts

- `docs/db-baseline.md` — procedure
- `prisma/baselines/2026-09-11-pre-geo-production.sql` — introspected pre-GEO schema
- `scripts/baseline-and-migrate-prod.sh` — resolve m1–m2 + deploy remainder
- `scripts/live-deploy-verify.sh` — HTTP probes
