# Phases 1–12 review pass

Branch: `cursor/xoopa-phases-review-1821` (integration tip of Phases 9 + 11 + 12 on top of Phase 10/`main`).

## What was checked

### Executed
- `npx prisma validate` — schema valid after review patches
- `npx prisma generate` — client regenerated with new fields
- Targeted Vitest: billing limits, webhook URL SSRF, cron auth (see CI / local run notes below)
- Static merge of Phase 9/11/12 into one tip; Prisma migration folder rename for duplicate timestamps

### Static analysis only (not runtime-verified against live LLM/provider APIs)
- Plan-tier enforcement paths in citation runner, tracked-query create, competitor create, suggestion/gap gates
- Cron weekday fan-out (`planRunsOnUtcWeekday`) vs `runNow` on create
- Public scorecard payload privacy (no prompts/raw responses/billing in public DTO)
- Auth on Phase 9–12 API routes (session or cron secret; unsubscribe token; QStash signature in production)
- Cost paths: citation sweeps, sentiment, suggestions, gap analysis, OG fonts fetch
- Honesty: `isDemoMode()` only for labeled demo citation-share stub; legacy `simulateResponse` removed from citation-tracker

## What was fixed

1. **`plans.ts` JSDoc** — Phase 12 `alertWebhooks` comment lost `/**` in merge → TypeScript parse break. Restored.
2. **Cron auth fail-closed** — all `/api/cron/*` routes now require `CRON_SECRET` (missing secret → 401). Previously fail-open when unset.
3. **Webhook SSRF hardening** — block IPv4-mapped IPv6 (`::ffff:…`), trailing-dot `localhost.`, `.local` / `.localhost`. Tests added.
4. **Legacy citation-tracker honesty** — removed fabricated `simulateResponse` on missing keys / HTTP failure; throws instead.
5. **Duplicate migration timestamps** — `20260911010000_add_public_scorecard` renamed to `20260911015000_…` so fresh `migrate deploy` has a deterministic order with suggestion outcomes.
6. **`runNow` schedule bypass** — tracked-query create no longer runs sweeps on UTC weekdays outside the plan’s Mon(/Thu) schedule; deferred with explicit reason.
7. **Gap-analysis quota undercount** — regenerating the same cached row no longer counts as 1/`updatedAt` only; `generationCount` + `generationWindowStart` sum into the shared monthly suggestion quota.
8. **Sentiment backfill infinite retry** — failed classifications set `sentimentClassifyFailed` so cron does not re-spend forever on null sentiment.
9. **Scorecard OG image** — unpublished/unknown slug calls `notFound()` instead of returning a 200 “unavailable” PNG.

## Needs Tom’s judgement (not silently “fixed”)

1. **Pro suggestion soft cap** — overage still runs LLM with a warning. Intentional fair-use, but unbounded cost if abused.
2. ~~**DNS rebinding on webhooks**~~ — **Resolved** in `cursor/xoopa-review-decisions-1821`: DNS re-resolved + private-IP rejected at send time (`assertWebhookDnsSafe`).
3. **First-run `runNow` UX** — schedule gate may frustrate Mon-only Free users who expect an immediate first sweep after signup. Alternative: one free onboarding sweep exception.
4. ~~**Legacy GeoCard / `citation-tracker` path**~~ — **Resolved**: legacy path removed; Phase 2 `citation-runner` is the only production/cron citation path. `GeoMetric` table retained as archive (no writers).
5. ~~**QStash signature fail-open outside production**~~ — **Resolved**: all QStash workers reject invalid signatures in every `NODE_ENV`.
6. ~~**Scorecard shows competitor brand names**~~ — **Resolved**: public `/score/[slug]` shows anonymized rank only; private dashboard Compare still names competitors.
7. **Email alerts** — still no mail provider wired (`NO_MAIL_PROVIDER`); Phase 12 ships unsubscribe + digest cron skip.

## Could not verify without real APIs / prod config

- Live citation / sentiment / gap LLM calls and dollar cost
- Vercel cron actually presenting `Authorization: Bearer $CRON_SECRET`
- End-to-end public scorecard toggle 404 on production CDN
- Fresh DB `prisma migrate deploy` against Neon (no DATABASE_URL in this agent env) — migration SQL reviewed; deploy not executed
- Webhook delivery against a real HTTPS endpoint
- Auto-merge / production commit on `main` after Vercel check

## Remaining known integration risks (flagged, not changed)

- Multiple mention-rate helpers across analytics / scorecard / competitor compare — same formula, duplicated; consolidate later
- `GeoMetric` archive table still in schema (historical rows preserved; no product writers). Drop after Tom confirms no need for old diagnostics history.
- `lib/geo/analytics.ts` still builds dashboards from `GeoMetric` records but has no live UI/API writers after legacy removal — consider deleting in a follow-up if unused.
- Webhook DNS check uses Node `dns.lookup` (OS resolver); does not pin the TCP connection to the validated IP (TOCTOU remains if OS cache flips between lookup and connect). Further hardening would use a custom agent / pinned socket.

## Review decisions follow-up (`cursor/xoopa-review-decisions-1821`)

Tom confirmed four items; shipped:

1. **Remove legacy Geo tracker** — deleted `citation-tracker`, GeoCard, `/api/geo/check`, `/api/geo/metrics`; ship-update skips legacy geo; diagnostics geo_audit reads `CitationRun`. Cron remains `citation-runs` → Phase 2 runner only.
2. **QStash always fail-closed** — no `NODE_ENV === "production"` exception on queue workers.
3. **Webhook DNS rebinding** — `assertWebhookDnsSafe` at deliver time (+ per retry).
4. **Public scorecard anonymized ranks** — `anonymousRank` payload; methodology doc updated.
