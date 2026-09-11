#!/usr/bin/env bash
# Live deployment probes for Phases 1–12 review gaps.
# Does NOT invent success — prints HTTP status + body snippets.
#
# Usage:
#   BASE_URL=https://vibelaunch-nu.vercel.app ./scripts/live-deploy-verify.sh
#   # Preview (needs vercel auth / protection bypass):
#   BASE_URL=https://xoopa-ptzqole8j-hirefastcareers-projects.vercel.app \
#     VERCEL_PROTECTION_BYPASS=... ./scripts/live-deploy-verify.sh
# Optional session for authenticated checks:
#   SESSION_COOKIE='__Secure-next-auth.session-token=...' ./scripts/live-deploy-verify.sh

set -euo pipefail

BASE_URL="${BASE_URL:-https://vibelaunch-nu.vercel.app}"
BASE_URL="${BASE_URL%/}"

CURL=(curl -sS)
if [[ -n "${VERCEL_PROTECTION_BYPASS:-}" ]]; then
  CURL+=(-H "x-vercel-protection-bypass: ${VERCEL_PROTECTION_BYPASS}")
fi
if [[ -n "${SESSION_COOKIE:-}" ]]; then
  CURL+=(-H "Cookie: ${SESSION_COOKIE}")
fi

probe() {
  local method="$1" path="$2"
  shift 2
  local tmp
  tmp="$(mktemp)"
  local code
  code="$("${CURL[@]}" -X "$method" -o "$tmp" -w '%{http_code}' "$@" "${BASE_URL}${path}" || echo ERR)"
  local body
  body="$(head -c 180 "$tmp" | tr '\n' ' ')"
  rm -f "$tmp"
  printf '%s %s %s | %s\n' "$code" "$method" "$path" "$body"
}

echo "=== live-deploy-verify BASE_URL=${BASE_URL} ==="
echo "--- cron: missing Authorization ---"
for path in /api/cron/diagnostics /api/cron/citation-runs /api/cron/backfill-sentiment /api/cron/analytics /api/cron/change-alerts; do
  probe GET "$path"
done

echo "--- cron: invalid bearer ---"
probe GET /api/cron/diagnostics -H 'Authorization: Bearer clearly-invalid-secret'
probe GET /api/cron/citation-runs -H 'Authorization: Bearer clearly-invalid-secret'
probe GET /api/cron/change-alerts -H 'Authorization: Bearer clearly-invalid-secret'

echo "--- unauthenticated geo / alerts ---"
probe GET /api/geo/tracked-queries
probe GET /api/geo/competitors
probe GET /api/geo/suggestions
probe GET /api/alerts
probe GET /api/geo/scorecard

echo "--- public scorecard unknown slug ---"
probe GET /score/live-verify-missing-slug-xyz

if [[ -n "${SESSION_COOKIE:-}" ]]; then
  echo "--- authenticated: SSRF webhook attempt ---"
  probe PATCH /api/alerts -H 'Content-Type: application/json' \
    -d '{"webhookUrl":"http://127.0.0.1/hook"}'
  probe PATCH /api/alerts -H 'Content-Type: application/json' \
    -d '{"webhookUrl":"http://169.254.169.254/latest/meta-data/"}'

  echo "--- authenticated: publish/unpublish scorecard ---"
  probe PATCH /api/geo/scorecard -H 'Content-Type: application/json' -d '{"public":true}'
  # Caller should capture slug from response and re-probe /score/<slug>
else
  echo "--- skip authenticated checks (set SESSION_COOKIE) ---"
fi

echo "=== done ==="
