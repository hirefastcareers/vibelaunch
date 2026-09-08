# Wiring Checklist

Last reviewed: **2026-09-08**. Owner confirmation: production Vercel already has OpenAI, Perplexity, Anthropic, QStash, and related keys set this morning. Treat unchecked items below as **still verify in Vercel**, not “missing by default.”

Production domains: `https://xoopa.app` and `https://vibelaunch-nu.vercel.app`.

## Status snapshot (2026-09-08)

| Area | Status | Evidence |
|---|---|---|
| X OAuth sign-in + publish | **Live** | Morning fixes for callback URL, pool, token refresh, fresh token on sign-in |
| Database | **Live** (assumed) | App serves authenticated dashboard / APIs |
| OpenAI / Perplexity / Anthropic | **Set in Vercel** | Owner confirmed morning env update |
| QStash | **Set in Vercel** | Owner confirmed |
| Replies (mentions + draft + post) | **Shipped** | PR #21 on `main` |
| Ship update pack | **Landing** | PR #23 (`POST /api/ship`) |
| Blob / Google Indexing / Dodo / X bearer | **Verify** | Confirm in Vercel dashboard if screenshot, indexing, billing, keyword search work |

## Production go-live (reference order)

Use the **same** `DATABASE_URL` as local so projects, drafts, and X tokens carry over.

1. Vercel → Project → Settings → Environment Variables (production + preview as needed).
2. X developer portal callbacks (exact, no trailing slash):
   - `https://xoopa.app/api/auth/callback/twitter`
   - `https://vibelaunch-nu.vercel.app/api/auth/callback/twitter`
   - Keep localhost callbacks for local dev.
3. Redeploy after env changes. Sign in on the **live** URL.
4. Smoke: Home → **Ship update**, Queue → Publish to X, Replies, GEO Recheck.

## Database
- [x] `DATABASE_URL` — Postgres with pgvector (live app depends on it)

## Auth
- [x] `NEXTAUTH_SECRET`
- [x] `NEXTAUTH_URL` / request-origin handling — live X login fixed 2026-09-08 (no longer pinned to localhost on Vercel)

## X (Twitter)
- [x] `X_CLIENT_ID`
- [x] `X_CLIENT_SECRET`
- [ ] `X_BEARER_TOKEN` (or `X_API_KEY` alias) — optional; needed only for Replies **keyword** search. Mentions work with user OAuth alone.

## AI / embeddings
- [x] `OPENAI_API_KEY` — generation + embeddings + ChatGPT GEO checks (owner: set 2026-09-08)
- [x] `ANTHROPIC_API_KEY` — Claude GEO checks (owner: set 2026-09-08)
- [x] `PERPLEXITY_API_KEY` — Perplexity GEO checks (owner: set 2026-09-08)

## Google indexing
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` — verify in Vercel
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — verify in Vercel  
  Gates: changelog Google indexing (`src/lib/seo/google-indexing.ts`). Article publish still works without it; indexing is best-effort.

## QStash (Upstash)
- [x] `QSTASH_TOKEN` (owner: set 2026-09-08)
- [x] `QSTASH_CURRENT_SIGNING_KEY`
- [x] `QSTASH_NEXT_SIGNING_KEY`
- [ ] `QSTASH_CALLBACK_URL` — optional override for post-publish queue only; media capture builds callback via `getBaseUrl()`

## Storage
- [ ] `BLOB_READ_WRITE_TOKEN` — enable Vercel Blob if not already; required for Ship update screenshots / code cards

## Cron protection
- [x] `CRON_SECRET` — needed for `/api/cron/analytics` and diagnostics (set with other morning keys if present; confirm in Vercel)

## Billing (Dodo Payments)
- [ ] `DODO_PAYMENTS_API_KEY`
- [ ] `DODO_PAYMENTS_WEBHOOK_KEY`
- [ ] `DODO_PAYMENTS_ENVIRONMENT` — `live_mode` for production
- [ ] `DODO_PAYMENTS_RETURN_URL`
- [ ] `DODO_STARTER_PRODUCT_ID` / `DODO_PRO_PRODUCT_ID`
- Optional for the growth loop; required only when taking paid upgrades.

---
Checked items reflect production reality as of 2026-09-08. Re-check Vercel if a smoke test fails.
