# Wiring Checklist

Everything below is unconfigured. The app runs in demo mode (see src/lib/demo-mode.ts) until these are set. Check items off as they're wired up.

## Database
- [ ] `DATABASE_URL` — Postgres with pgvector support (Neon or Supabase recommended, both support the extension on free tiers). Schema already declares `extensions = [vector]` (prisma/schema.prisma), so `npx prisma db push` creates it automatically once this is set.

## Auth
- [ ] `NEXTAUTH_SECRET` — random 32+ char string
- [ ] `NEXTAUTH_URL` — production URL (e.g. https://sorano.app)

## X (Twitter)
- [ ] `X_CLIENT_ID`
- [ ] `X_CLIENT_SECRET`
- [ ] `X_API_KEY`
  Gates: sign-in with X, post publishing, replies feed (src/app/api/replies/feed/route.ts falls back to an honest "not configured" empty state without this, per the replies feed fix).

## AI / embeddings
- [ ] `OPENAI_API_KEY` — embeddings (src/lib/vector/embeddings.ts) + adaptive generation
- [ ] `ANTHROPIC_API_KEY` — one of two GEO citation-check providers (src/lib/geo/citation-tracker.ts)
- [ ] `PERPLEXITY_API_KEY` — the other GEO citation-check provider

## Google indexing
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  Gates: SEO changelog Google indexing (src/lib/seo/google-indexing.ts). Requires a GCP service account with Indexing API access.

## QStash (Upstash)
- [ ] `QSTASH_TOKEN`
- [ ] `QSTASH_CURRENT_SIGNING_KEY`
- [ ] `QSTASH_NEXT_SIGNING_KEY`
- [ ] `QSTASH_CALLBACK_URL` — used as an override for the post-publish queue specifically; the media capture queue resolves its own callback URL dynamically via getBaseUrl(), no separate var needed for that one.
  Gates: post publish queue (src/app/api/queue/process/route.ts), media capture queue (src/app/api/media/capture/process/route.ts).

## Storage
- [ ] Enable Vercel Blob in the Vercel dashboard (Storage tab) — auto-populates `BLOB_READ_WRITE_TOKEN`. No manual value to generate.
  Gates: screenshot capture, video capture, code-card PNGs (src/lib/media/*). NOTE: these do NOT check isDemoMode() — they attempt real capture/upload regardless, so triggering them before this is wired will throw a real error, not fall back to a placeholder. That's intentional (an honest failure beats a silent fake), but worth knowing before clicking "capture" anywhere in the dashboard pre-wiring.

## Cron protection
- [ ] `CRON_SECRET` — random string, no external account needed. Worth setting now even before other services are wired, since it's free and Vercel auto-injects it as the Authorization header on cron invocations (see vercel.json).

## Billing (Dodo Payments)
- [ ] `DODO_PAYMENTS_API_KEY`
- [ ] `DODO_PAYMENTS_WEBHOOK_KEY`
- [ ] `DODO_PAYMENTS_ENVIRONMENT` — set to `live_mode` for production
- [ ] `DODO_PAYMENTS_RETURN_URL`
- [ ] Create "Sorano Starter" product — $19.00 USD/month recurring subscription
- [ ] Create "Sorano Pro" product — $49.00 USD/month recurring subscription
- [ ] `DODO_STARTER_PRODUCT_ID` — paste after creating the Starter product above
- [ ] `DODO_PRO_PRODUCT_ID` — paste after creating the Pro product above
- [ ] Dodo Dashboard → Settings → Business → enable **Adaptive Currency** (auto-detects customer's country at checkout, charges in their local currency — e.g. GBP for UK customers — at live exchange rates, zero code required)
- [ ] Decide on Adaptive Currency's **Fees Inclusive** sub-toggle: off (default) means the customer pays a 2-4% FX fee on top of the local-currency price; on means you absorb it out of settlement instead so the customer sees a cleaner number. Recommendation: leave off for now (matches how most bootstrapped SaaS handle this), revisit if conversion data suggests otherwise.
  Gates: checkout route (src/app/checkout/route.ts), customer portal (src/app/customer-portal/route.ts), webhook handler (src/app/api/webhook/dodo-payments/route.ts).
  NOTE: the pricing page itself displays USD prices with a note that billing happens in the customer's local currency at checkout — it does not attempt to show a pre-converted local-currency estimate, to avoid a displayed price drifting from what Dodo actually charges (see docs/deferred-work.md for the reasoning if it's logged there).

---
Once all of the above are set in Vercel's environment variables and a deploy has run, isDemoMode() (src/lib/demo-mode.ts) will automatically stop returning true, and the app switches from demo data to live data with no code changes needed.
