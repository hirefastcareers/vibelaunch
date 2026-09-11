# Production DB baseline (2026-09-11)

## Problem

Live verification (`docs/phases-1-12-live-verify.md`) found the Vercel `DATABASE_URL`
(Supabase) had foundation tables from historical `db push`, **no** `_prisma_migrations`,
and **no** Phase 2–12 GEO tables — while production code already expected them.

## What was already on production (pre-baseline)

Tables: Account, ChangelogEntry, EriSnapshot, GeoMetric, Post, PostAnalytics,
PostEmbedding, Project, Session, TestRun, User, VerificationToken.

Already present (so migrations 1–2 must **not** re-run):

- `Project.lastCaptureUrl`, `Project.lastCapturedAt`
- `PlanTier` enum + `User` billing columns + `User_dodoCustomerId_key`

## Procedure executed

### Staging (local Postgres clone) — first

1. `prisma migrate diff --from-empty --to-url $PROD` →
   `prisma/baselines/2026-09-11-pre-geo-production.sql`
2. Applied that SQL to local `xoopa_staging` (+ `vector` extension)
3. Copied production rows (1 user / 1 project / …) into staging
4. Ran `scripts/baseline-and-migrate-prod.sh` against staging
5. Result: all 12 migrations recorded; GEO tables present; existing rows intact

### Production — after staging succeeded

Same script against live `DATABASE_URL`:

- Resolved as applied: `20260902120000_add_project_capture_fields`,
  `20260902153000_add_user_billing_fields`
- Deployed: citation tracking → grok enum → competitors → suggestions →
  competitor sentiment → suggestion outcomes → public scorecard →
  gap analysis → change alerts → review quota/sentiment guards
- Renamed truncated `SuggestionOutcome` unique index to match Prisma
- `prisma migrate diff` vs `schema.prisma`: empty (no drift)
- Row counts unchanged for existing foundation tables

## Re-run

```bash
# staging clone first, then:
DATABASE_URL=... ./scripts/baseline-and-migrate-prod.sh
```

Do **not** run migrations 1–2 SQL on production — they would fail
(`column already exists` / `type already exists`).
