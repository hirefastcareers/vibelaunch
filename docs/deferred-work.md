# Deferred work

Known issues that are recorded and not yet fixed. Do not silently drop them. Move an item to Resolved only once it is actually mitigated.

## Open

- [2026-09-10] **Phase 2 citation tracking — estimated API cost (review before raising frequency).** Per TrackedQuery sweep = 4 model calls. Rough list prices (USD, subject to change): OpenAI `gpt-4o-mini` + `web_search_preview` ≈ $0.01–0.05/call (search tool surcharge dominates); Anthropic `claude-3-5-haiku` ≈ $0.001–0.01/call (no web tool); Gemini Flash + Google Search grounding ≈ $0.01–0.035/call; Perplexity `sonar` ≈ $0.005–0.02/call. **Blended estimate ~$0.03–0.10 per query per sweep.** At 2×/week: ~$0.06–0.20/query/week. Log actual invoices after first production week before increasing cadence.
- [2026-09-10] **Phase 3 — sentiment classification** on `CitationRun.sentiment` (schema column exists, always null in Phase 2).
- [2026-09-10] **Phase 3 — competitor comparison view** (share-of-voice vs named rivals).
- [2026-09-10] **OpenAI web_search ambiguity:** Official docs recommend Responses API `tools: [{ type: "web_search" }]`, but `openai@4.104` TypeScript types only expose `web_search_preview`. Implementation tries `web_search_preview` first, then falls back to untyped `web_search`. Prefer SDK bump when types catch up.
- [2026-09-10] **Anthropic limitation:** No first-party web-search/citation tool in Messages API — `citedUrls` are regex-extracted from raw text only; mention detection still runs on `rawResponse`.
- [2026-09-10] **Gemini grounding URLs** may be redirector URIs (`vertexaisearch.cloud.google.com/...`) rather than final publisher URLs — store as returned; optional resolve step deferred.
- [2026-09-10] **ERI / Virality Score flagged OFF** (`FEATURES.ERI_ANALYTICS`, `ERI_REINFORCEMENT`, `ERI_INSPIRED_GENERATION`) — removed from product surface for Xoopa GEO focus; code + schema retained. `/api/cron/analytics` schedule removed from `vercel.json`. Reason: belongs to X-growth scope, not Xoopa's GEO focus.
- [2026-09-10] Smart Scheduler / optimal-posting-time — not present in codebase (only plain `scheduledAt` + QStash). Logged as out of scope for Xoopa GEO; do not reintroduce. Reason: belongs to X-growth scope, not Xoopa's GEO focus.
- [2026-09-10] Auto Retweet / Auto DM / Auto Delete — not present in codebase. Logged as out of scope. Reason: belongs to X-growth scope, not Xoopa's GEO focus.
- [2026-09-10] Engagement Growth Feed ("reply to this for visibility") — not present (Replies inbox is mention/keyword reply tooling, kept). Reason: belongs to X-growth scope, not Xoopa's GEO focus.
- [2026-09-10] Viral post discovery / trend library ("Daily Viral Inspiration", "Trend-Based Inspiration") — not present. Reason: belongs to X-growth scope, not Xoopa's GEO focus.
- [2026-09-10] Ambiguity: GitHub repo + Vercel project slug remain `vibelaunch` / `vibelaunch-nu.vercel.app` (live twin domain). Package npm name renamed to `xoopa`. Do not rename production URL allowlists without DNS/Vercel project changes.
- [2026-09-02] Video-to-X publishing is not implemented. recordSiteVideo() outputs .webm, which X does not accept for video posts (requires mp4). Full support would need: (a) X's chunked INIT/APPEND/FINALIZE upload flow for video specifically, (b) a webm-to-mp4 transcode step (likely ffmpeg, not currently a dependency), and (c) actually wiring recordSiteVideo's output into a Post's mediaUrls somewhere in the UI, which doesn't happen today. uploadMedia() now throws a clear error if a non-image media type is ever passed, rather than silently failing or misbehaving.
- [2026-09-02] Google AI Overviews citation checking is not implemented — no official Google API exists for this, it would require a paid third-party SERP-scraping service (e.g. Apify-style actors, ~$5/1,000 checks) and carries Google ToS gray-area risk since it involves rendering/parsing live search results rather than calling an official endpoint. Landing page copy was corrected to only claim what's real (ChatGPT, Perplexity, Claude) — revisit as a real feature only if there's clear demand and appetite for the recurring cost/risk.
- [2026-09-03] Handover rewrite landed with competitive research + P0–P2 roadmap. Keep `docs/handover.md` status tables in sync when P0 items ship (especially video→X and wiring checklist checkoffs). Replies feed (P0.7) shipped: mentions + optional keyword search + generate/post.
- [2026-09-08] Replies keyword search needs X Basic+ access for recent search. Mentions work on user OAuth alone.
- [2026-09-08] Legacy GEO `checkLLMCitations` path still silently calls `simulateResponse()` when a provider key is missing or the HTTP call fails, then stores `GeoMetric` rows as if live. New `CitationRun` pipeline stores `error` instead and never fakes `brandMentioned`. Need live-vs-simulated labeling (or hard fail) on the legacy path.
- [2026-09-08] Wiring checklist refreshed against morning env + afternoon Replies/Ship work. See `docs/plan-2026-09-08.md` for the remaining P0 order.

## Resolved

- [2026-09-10] Phase 2 AI citation tracking pipeline landed: `TrackedQuery` + `CitationRun` schema, 4 model runners (OpenAI Responses + `web_search_preview` with `web_search` fallback, Anthropic messages, Gemini Google Search grounding, Perplexity citations), brand-mention detection, QStash fan-out + Vercel cron Mon/Thu 06:00 UTC, dashboard live wiring with `isDemoMode()` stub fallback only when no live runs exist.

- [2026-09-02] GEO FAQ/schema pricing claims now reflect real billing: Free (1 project, 8 posts/month), Starter $19/mo (3/40), Pro $49/mo (10/200), with AI features included on every tier. Previously still said "free during early access / no paid tier yet" after Pass 2 launched paid plans.
- [2026-09-02] Billing (Dodo Payments) Pass 2: usage-cap enforcement (projects + posts/month), dashboard billing page, and checkout/portal wiring. Starter/Pro product IDs live in local/Vercel env, not in vercel.env.example.
- [2026-09-02] Fixed GEO FAQ/schema pricing claims that described paid plans and paywalled features that don't exist yet. Now accurately states the product is free during early access.
- [2026-09-02] X publish hardened: real OAuth2 token refresh added (was previously unused despite the DB already storing refresh_token/expires_at), and publish/metrics failures now distinguish auth-expired vs API errors instead of one generic bucket. fetchTweetMetrics no longer silently returns fake zero-engagement data on failure.
- [2026-09-02] Removed duplicate /api/cron/eri route; /api/cron/analytics (which already had demo-mode handling) is now the single source for ERI analytics + embedding reinforcement.
- [2026-09-02] Confirmed Vercel Pro plan — maxDuration = 60 in the generate route is valid as-is (Pro's default max without Fluid Compute is 60s). No action needed. If video duration is ever increased much past the current 15s default, revisit with Fluid Compute enabled (up to 800s) or move to the QStash async pattern.
