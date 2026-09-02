# Deferred work

Known issues that are recorded and not yet fixed. Do not silently drop them. Move an item to Resolved only once it is actually mitigated.

## Open

- [2026-09-02] Google AI Overviews citation checking is not implemented — no official Google API exists for this, it would require a paid third-party SERP-scraping service (e.g. Apify-style actors, ~$5/1,000 checks) and carries Google ToS gray-area risk since it involves rendering/parsing live search results rather than calling an official endpoint. Landing page copy was corrected to only claim what's real (ChatGPT, Perplexity, Claude) — revisit as a real feature only if there's clear demand and appetite for the recurring cost/risk.

## Resolved

- [2026-09-02] X publish hardened: real OAuth2 token refresh added (was previously unused despite the DB already storing refresh_token/expires_at), and publish/metrics failures now distinguish auth-expired vs API errors instead of one generic bucket. fetchTweetMetrics no longer silently returns fake zero-engagement data on failure.
- [2026-09-02] Removed duplicate /api/cron/eri route; /api/cron/analytics (which already had demo-mode handling) is now the single source for ERI analytics + embedding reinforcement.
- [2026-09-02] Confirmed Vercel Pro plan — maxDuration = 60 in the generate route is valid as-is (Pro's default max without Fluid Compute is 60s). No action needed. If video duration is ever increased much past the current 15s default, revisit with Fluid Compute enabled (up to 800s) or move to the QStash async pattern.
