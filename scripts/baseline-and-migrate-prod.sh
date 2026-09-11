#!/usr/bin/env bash
# Baseline a production-like DB that already has pre-GEO tables (migrations 1–2
# effects present) but no _prisma_migrations, then apply Phase 2–12 GEO migrations.
#
# STAGING FIRST:
#   1. Clone/schema-copy production into a throwaway DB
#   2. DATABASE_URL=<staging> ./scripts/baseline-and-migrate-prod.sh
#   3. Only then run against production
#
# What this does:
#   - Marks 20260902120000 + 20260902153000 as already applied (no SQL re-run)
#   - prisma migrate deploy for the remaining 10 GEO migrations
#   - Renames a Postgres-truncated SuggestionOutcome index to match Prisma
#
# Safe: does not DROP existing tables. Migrations 3–12 are additive CREATE/ALTER.

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "Target: ${DATABASE_URL%%@*}@***"

echo "Marking pre-GEO migrations as applied (schema already present)..."
npx prisma migrate resolve --applied 20260902120000_add_project_capture_fields
npx prisma migrate resolve --applied 20260902153000_add_user_billing_fields

echo "Deploying remaining migrations..."
npx prisma migrate deploy

echo "Aligning truncated SuggestionOutcome index name (idempotent)..."
npx prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
ALTER INDEX IF EXISTS "SuggestionOutcome_contentSuggestionId_citationRunId_matchType_k"
  RENAME TO "SuggestionOutcome_contentSuggestionId_citationRunId_matchTy_key";
SQL

echo "Checking for schema drift vs prisma/schema.prisma..."
DIFF=$(npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script)
if echo "$DIFF" | grep -qv 'empty migration'; then
  echo "$DIFF"
  echo "WARNING: residual drift detected" >&2
else
  echo "No schema drift."
fi

npx prisma migrate status
echo "Done."
