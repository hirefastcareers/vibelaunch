# Phases 1–12 live verification report

Date: **2026-09-11**. Branch tip exercised for code/migrations: `cursor/xoopa-phases-review-1821` (PR #39). Live HTTP host reachable without SSO: `https://vibelaunch-nu.vercel.app` (production = `main`, **does not** include Phase 9–12). Preview for the review tip is SSO-protected (`https://xoopa-ptzqole8j-hirefastcareers-projects.vercel.app`). `https://xoopa.app` did not resolve from this agent network.

**Rule followed:** nothing below is marked verified unless it was actually executed. Ambiguity is flagged.

---

## 1. Vitest suite + fresh migration

| Check | Executed? | Result |
|-------|-----------|--------|
| Full Vitest on review tip | **Yes (local)** | **195/195 passed** (50 files) |
| `prisma migrate deploy` on empty Postgres + pgvector | **Yes (local clean DB)** | **FAILED** — first migration `ALTER TABLE "Project"` / no baseline (`P3018` relation does not exist) |
| Same migration SQLs in timestamp order after stub `User`+`Project` tables | **Yes (local)** | **All 12 applied cleanly**, including renamed `20260911015000_add_public_scorecard` after `…1010000_add_suggestion_outcomes` |
| `prisma db push` on empty DB | **Yes (local)** | **Succeeded** (schema sync; not migrate history) |
| Fresh migrate against **Neon production/preview** | **No** | No production `DATABASE_URL` in agent env |

**Verdict:** The review’s “duplicate timestamp / ordering” fix holds when a baseline schema exists. A **greenfield** `migrate deploy` still fails without an initial/baseline migration — this is a real gap, executed and confirmed.

---

## 2. Plan-tier enforcement (Free / Starter / Pro)

| Check | Executed? | Result |
|-------|-----------|--------|
| Free/Starter hard caps for prompts, competitors, suggestions via **same helpers APIs call**, against real Postgres | **Yes — local DB only** | Caps reject with `UsageLimitError` / expected codes (`scripts/local-plan-cap-verify.ts`, 18/18) |
| Free models = 3; Starter/Pro = 5; Mon-only vs Mon+Thu helpers | **Yes — local** | Passed |
| Exceed caps via **real HTTP** on live preview/production | **No** | Needs NextAuth session cookie (X OAuth). Production APIs return **401** without session (probed). Preview SSO blocks unauthenticated access to app routes |
| Starter/Pro accounts on live deploy | **No** | Cannot create/promote tiers without session + DB write or Dodo checkout |

**Verdict:** Server-side helpers enforce caps against a real DB locally. **Not** verified end-to-end against the live deployment via real API requests.

---

## 3. Public scorecard — live check

| Check | Executed? | Result |
|-------|-----------|--------|
| `GET /score/[slug]` on production | **Yes (live prod)** | **404** — Phase 9 not on `main` |
| `GET /api/geo/scorecard` on production | **Yes (live prod)** | **404** |
| Publish → fetch unauthenticated → unpublish → 404 on **preview tip** | **No** | Preview behind Vercel SSO; no session cookie |
| `buildScorecardPayload` omits prompts / raw responses / billing fields | **Yes — local builder** | Payload keys only aggregates; competitor **names** appear in `ranking` (open product question from review) |

**Verdict:** Privacy of the DTO builder checked locally. **Live** publish/unpublish/CDN 404 on the review tip was **not** executed.

---

## 4. Webhook safety — live check

| Check | Executed? | Result |
|-------|-----------|--------|
| `validateAlertWebhookUrl` rejects `127.0.0.1`, `169.254.169.254`, IPv4-mapped IPv6, `localhost` | **Yes — local (same function alerts API uses)** | Rejected |
| `PATCH /api/alerts` with private URL on **live** deploy | **No** | Needs session + Starter/Pro (`alertWebhooks`); Free gated; preview SSO |
| DNS rebinding (validate hostname at save, resolve evil IP at fetch) | **No** | Still deferred by design; not implemented to test |

**Verdict:** Validator behavior confirmed locally. **Live API rejection** and **DNS-rebinding** remain unverified.

---

## 5. Cron auth — live check

| Check | Executed? | Result |
|-------|-----------|--------|
| Production `GET` cron routes **without** `Authorization` | **Yes (live prod)** | `/api/cron/diagnostics`, `citation-runs`, `backfill-sentiment`, `analytics` → **401** `{"error":"Unauthorized"}` |
| Production with `Authorization: Bearer clearly-invalid-secret` | **Yes (live prod)** | **401** |
| Production `/api/cron/change-alerts` | **Yes (live prod)** | **404** (Phase 12 not on `main`) |
| Preview tip cron (fail-closed when `CRON_SECRET` missing) | **No** | SSO 302 before app handler; also cannot unset prod secret to prove fail-closed |
| Proof that Vercel Cron sends `Bearer $CRON_SECRET` | **No** | Would need successful authorized cron invocation / platform logs |

**Note:** `main` still uses fail-open when `CRON_SECRET` is unset (`if (cronSecret && …)`). Review tip uses fail-closed (`if (!cronSecret || …)`). Production 401s imply **`CRON_SECRET` is set** in prod today — not that fail-closed is deployed.

---

## 6. Live AI pipeline smoke test

| Check | Executed? | Result |
|-------|-----------|--------|
| One prompt × 5 models end-to-end on live deploy | **No** | Needs session (`runNow` or cron+QStash) + provider keys on deploy; no agent access to keys/session |
| `CitationRun` rows + sentiment + `isDemoMode()` not used | **No** | |
| Observed $ cost for one run | **No** | No invoice/API usage meters available to this agent |

**Verdict:** Not executed. Do not treat list-price estimates in docs as observed cost.

---

## 7. Could not test without Tom (or secrets)

- Approve **Vercel MCP** / provide `VERCEL_TOKEN` (or protection bypass) for SSO-protected preview
- **X OAuth session cookie** for a Free test user (and DB promote or Dodo for Starter/Pro)
- Completing a **real Dodo checkout**
- **Email deliverability** (no mail provider configured — review already notes `NO_MAIL_PROVIDER`)
- Subjective **UI/copy** review
- Confirming Vercel Cron’s real `Authorization` header in platform logs
- Production **Neon** `migrate deploy` with real `DATABASE_URL`
- DNS-rebinding hardening product decision

---

## Artifacts in this branch

- `scripts/local-plan-cap-verify.ts` — local DB helper verification (not live deploy)
- `scripts/live-deploy-verify.sh` — re-runnable live HTTP probes (session/bypass optional)
- Vitest log: 195 passed on review tip at verification time

## Hosts used

| Host | Role | Access from agent |
|------|------|-------------------|
| `https://vibelaunch-nu.vercel.app` | Production (`main`) | Public HTTP OK |
| `https://xoopa.app` | Production custom domain | DNS resolve failed here |
| `https://xoopa-ptzqole8j-hirefastcareers-projects.vercel.app` | PR #39 preview | Vercel SSO 302 |
| `https://xoopa-1ex433822-hirefastcareers-projects.vercel.app` | PR #40 preview | Vercel SSO 302 |
