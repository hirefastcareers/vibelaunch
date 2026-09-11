# Phases 1–12 live verification report

Date: **2026-09-11** (updated after Vercel CLI login as `hirefastcareers`).

Code tip for Phases 9–12: `cursor/xoopa-phases-review-1821` (PR #39) → preview `https://xoopa-ptzqole8j-hirefastcareers-projects.vercel.app` (alias `xoopa-git-cursor-xoopa-phases-r-0fb9d5-…`).

Production: `https://vibelaunch-nu.vercel.app` (`main`). `https://xoopa.app` did not resolve from this agent network.

**Rule:** nothing is marked verified unless it was actually executed.

---

## Critical live finding (executed)

The Vercel `DATABASE_URL` (Supabase `aws-1-eu-west-1.pooler.supabase.com` / `postgres`) **does not contain GEO / Phase 2–12 tables**.

Inspected live DB public tables: `Account`, `ChangelogEntry`, `EriSnapshot`, `GeoMetric`, `Post`, `PostAnalytics`, `PostEmbedding`, `Project`, `Session`, `TestRun`, `User`, `VerificationToken` only.

**Missing:** `TrackedQuery`, `CitationRun`, `CompetitorBrand`, `ContentSuggestion`, `Alert*`, scorecard columns, `_prisma_migrations`.

Runtime logs (live):

- `GET /api/geo/tracked-queries` → Prisma `P2021` table `TrackedQuery` does not exist
- `assertCanCreateProject` / `getUsage` → `ContentSuggestion` / `TrackedQuery` / `CompetitorBrand` missing → **500** on project create
- Authorized Vercel Cron `GET /api/cron/backfill-sentiment` → `CitationRun` missing (`P2021`)

There is **no** `_prisma_migrations` table — schema history looks like historical `db push`, not migrate deploy. Fresh local `migrate deploy` on empty Postgres also fails without a baseline (see §1).

**Do not** run `prisma migrate deploy` against this production URL from an agent without an explicit Tom decision + baseline plan (first migrations are `ALTER TABLE` only).

---

## 1. Vitest suite + fresh migration

| Check | Executed? | Result |
|-------|-----------|--------|
| Full Vitest on review tip | **Yes (local)** | **195/195 passed** |
| `prisma migrate deploy` on empty Postgres + pgvector | **Yes (local)** | **FAILED** — no baseline (`Project` missing) |
| Ordered SQL after stub `User`+`Project` | **Yes (local)** | **All 12 apply**, incl. renamed scorecard migration |
| `prisma db push` empty DB | **Yes (local)** | Succeeded |
| Live shared DB schema vs code | **Yes (live DB read)** | GEO tables **absent**; migrate history **absent** |

---

## 2. Plan-tier enforcement

| Check | Executed? | Result |
|-------|-----------|--------|
| Helpers vs local Postgres (review tip) | **Yes (local)** | Free/Starter caps + model/schedule helpers OK |
| Seed Free/Starter/Pro users + DB sessions in **live** Supabase | **Yes** | Created then deleted (`live-verify-*@xoopa-test.local`) |
| Session cookie against production | **Yes (live)** | `GET /api/projects` → **200** `{"projects":[]}` with `__Secure-next-auth.session-token` |
| Free project hard cap via live API | **Attempted (live)** | `POST /api/projects` → **500** because `getUsage()` queries missing GEO tables |
| Prompt/competitor/suggestion caps via live API | **Attempted (live)** | **500** (`TrackedQuery` / related missing) |
| Same caps on PR #39 preview | **Attempted (live)** | **401** — preview Prisma client expects Phase 9 `User.scorecard*` columns that DB lacks (session user load fails) |

**Verdict:** Live HTTP plan-cap rejection for GEO features **could not be completed** because the production database schema does not match shipped code. Project-cap path is also broken for the same reason.

---

## 3. Public scorecard

| Check | Executed? | Result |
|-------|-----------|--------|
| Prod `/score/*`, `/api/geo/scorecard` | **Yes (live prod)** | **404** (not on `main`) |
| Preview `/api/geo/scorecard` unauthenticated | **Yes (live preview, SSO bypass)** | **401** |
| Preview `/score/missing-slug` | **Yes (live preview)** | **500** (not a clean 404) — schema/code mismatch |
| Publish → public fetch → unpublish | **No** | Blocked by DB missing scorecard columns + auth failure on preview |
| Payload privacy (builder) | **Yes (local, review tip)** | No prompts/raw/billing; competitor names in ranking by design |

---

## 4. Webhook safety

| Check | Executed? | Result |
|-------|-----------|--------|
| URL validator rejects private IPs | **Yes (local)** | `127.0.0.1`, `169.254.169.254`, mapped IPv6, localhost rejected |
| Live `PATCH /api/alerts` SSRF | **Attempted (live preview)** | **401** (auth/schema); route exists on tip (`/api/alerts`) |
| DNS rebinding | **No** | Still deferred in product |

---

## 5. Cron auth

| Check | Executed? | Result |
|-------|-----------|--------|
| Prod missing/invalid `Authorization` | **Yes (live)** | **401** on diagnostics, citation-runs, backfill-sentiment, analytics |
| Preview tip missing/invalid auth (SSO bypassed via protection token) | **Yes (live)** | **401** on diagnostics, citation-runs, backfill-sentiment, **`/api/cron/alert-digest`** |
| Vercel Cron presents valid secret | **Inferred from live logs** | Prod/cron deployment reached handler then failed on missing `CitationRun` — auth passed |
| Fail-closed when `CRON_SECRET` unset | **No** | Cannot unset prod secret; tip code not on `main` yet |

---

## 6. Live AI pipeline smoke

| Check | Executed? | Result |
|-------|-----------|--------|
| 5-model citation run E2E | **No** | No `CitationRun` / `TrackedQuery` tables; Fri schedule gate; provider secrets not pullable (`[SENSITIVE]`) |
| Sentiment / cost | **No** | |

---

## 7. Still needs Tom

1. **Decide how to baseline + migrate the live Supabase DB** to Phase 2–12 (or point Vercel at a DB that already has those tables). Until then GEO/cron features cannot work in production.
2. After schema is real: Free/Starter/Pro live cap matrix, scorecard publish/unpublish, webhook SSRF via API, Mon/Thu 5-model smoke + invoice cost.
3. Dodo checkout, email provider, subjective UI/copy, DNS-rebinding product call.
4. Optional: grant Vercel MCP the `hirefastcareers-projects` team scope (CLI works; MCP still 403 for that team).

---

## Artifacts

- `scripts/live-deploy-verify.sh` — HTTP probes (use `vercel curl` or `x-vercel-protection-bypass` for previews)
- Test users cleaned up from the live DB after probes

## Access notes (this run)

- Vercel CLI: logged in as `hirefastcareers`; project linked `hirefastcareers-projects/xoopa`
- Protection bypass automation token present on the project (used for raw curl)
- `vercel env pull`: API keys / `CRON_SECRET` are sensitive placeholders; `DATABASE_URL` / `NEXTAUTH_SECRET` / X OAuth client values were readable
