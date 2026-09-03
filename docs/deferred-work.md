# Deferred work

Known issues that are recorded and not yet fixed. Do not silently drop them. Move an item to Resolved only once it is actually mitigated.

## Open

- [2026-09-02] Video-to-X publishing is not implemented. recordSiteVideo() outputs .webm, which X does not accept for video posts (requires mp4). Full support would need: (a) X's chunked INIT/APPEND/FINALIZE upload flow for video specifically, (b) a webm-to-mp4 transcode step (likely ffmpeg, not currently a dependency), and (c) actually wiring recordSiteVideo's output into a Post's mediaUrls somewhere in the UI, which doesn't happen today. uploadMedia() now throws a clear error if a non-image media type is ever passed, rather than silently failing or misbehaving.
- [2026-09-02] Google AI Overviews citation checking is not implemented — no official Google API exists for this, it would require a paid third-party SERP-scraping service (e.g. Apify-style actors, ~$5/1,000 checks) and carries Google ToS gray-area risk since it involves rendering/parsing live search results rather than calling an official endpoint. Landing page copy was corrected to only claim what's real (ChatGPT, Perplexity, Claude) — revisit as a real feature only if there's clear demand and appetite for the recurring cost/risk.
- [2026-09-03] Handover rewrite landed with competitive research + P0–P2 roadmap. Keep `docs/handover.md` status tables in sync when P0 items ship (especially replies feed, video→X, and wiring checklist checkoffs).

## Resolved

- [2026-09-02] Landing page now has a human-visible 05 - PRICING section (Free/Starter/Pro) between what-ships-weekly and FAQ. Signed-out CTAs go to sign-in; signed-in CTAs go to /dashboard/billing. JSON-LD was already updated in a prior pass.

- [2026-09-02] GEO FAQ/schema pricing claims now reflect real billing: Free (1 project, 8 posts/month), Starter $19/mo (3/40), Pro $49/mo (10/200), with AI features included on every tier. Previously still said "free during early access / no paid tier yet" after Pass 2 launched paid plans.
- [2026-09-02] Billing (Dodo Payments) Pass 2: usage-cap enforcement (projects + posts/month), dashboard billing page, and checkout/portal wiring. Starter/Pro product IDs live in local/Vercel env, not in vercel.env.example.
- [2026-09-02] Fixed GEO FAQ/schema pricing claims that described paid plans and paywalled features that don't exist yet. Now accurately states the product is free during early access.
- [2026-09-02] X publish hardened: real OAuth2 token refresh added (was previously unused despite the DB already storing refresh_token/expires_at), and publish/metrics failures now distinguish auth-expired vs API errors instead of one generic bucket. fetchTweetMetrics no longer silently returns fake zero-engagement data on failure.
- [2026-09-02] Removed duplicate /api/cron/eri route; /api/cron/analytics (which already had demo-mode handling) is now the single source for ERI analytics + embedding reinforcement.
- [2026-09-02] Confirmed Vercel Pro plan — maxDuration = 60 in the generate route is valid as-is (Pro's default max without Fluid Compute is 60s). No action needed. If video duration is ever increased much past the current 15s default, revisit with Fluid Compute enabled (up to 800s) or move to the QStash async pattern.
