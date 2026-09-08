# Wiring Checklist

Everything below must be configured for a live deploy. Check items off as they're wired up.

## Production go-live (do this in order)

Use the **same** `DATABASE_URL` as local so the Sorano project, drafts, and X tokens you already created carry over.

1. Vercel → Project → Settings → Environment Variables. Set production (and preview if you want PR logins) to:
   - `DATABASE_URL` (same Postgres as local, pgvector enabled)
   - `NEXTAUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL` = the live origin, e.g. `https://sorano.app` or `https://YOUR-APP.vercel.app`
   - `NEXTAUTH_SECRET` (a new 32+ char secret, not the localhost one)
   - `X_CLIENT_ID` / `X_CLIENT_SECRET` (same OAuth 2.0 client as local)
   - `OPENAI_API_KEY` (generation + embeddings)
   - `CRON_SECRET` (any random string)
2. X developer portal → User authentication settings → add production callbacks, exact, no trailing slash:
   - `https://YOUR-LIVE-ORIGIN/api/auth/callback/twitter`
   Keep the localhost callbacks too so local still works.
3. Redeploy production after saving env vars. Sign in on the **live** URL (cookies do not transfer from localhost).
4. Optional but needed for the full loop:
   - Upstash QStash (`QSTASH_*`) for scheduled posts and retries. Immediate **Publish to X** works without it.
   - Vercel Blob (Storage tab) for screenshots/code cards
   - `PERPLEXITY_API_KEY` and `ANTHROPIC_API_KEY` for live GEO citation checks
   - Google Indexing service account for changelog indexing
   - Dodo keys only if you are taking payments

After that: Command Center → Recheck (GEO), Publish a changelog article, Queue → Publish to X.

## Database
- [ ] `DATABASE_URL` — Postgres with pgvector support (Neon or Supabase recommended, both support the extension on free tiers). Schema already declares `extensions = [vector]` (prisma/schema.prisma), so `npx prisma db push` creates it automatically once this is set.

## Auth
- [ ] `NEXTAUTH_SECRET` — random 32+ char string
- [ ] `NEXTAUTH_URL` — production URL (e.g. https://xoopa.app)

## X (Twitter)
- [ ] `X_CLIENT_ID`
- [ ] `X_CLIENT_SECRET`
- [ ] `X_BEARER_TOKEN` (or `X_API_KEY` as alias) — optional app-only bearer for recent search
  Gates: Smart Replies keyword feed (`/api/replies/feed`). Without it, the feed still works via the signed-in user's OAuth token when X is connected; otherwise it returns an honest `configured: false` empty state. Mentions always use the user token.

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
  Gates: screenshot capture, video capture, code-card PNGs (src/lib/media/*). These attempt real capture/upload; triggering them before Blob is wired will throw a real error rather than silently faking success.

## Cron protection
- [ ] `CRON_SECRET` — random string, no external account needed. Worth setting now even before other services are wired, since it's free and Vercel auto-injects it as the Authorization header on cron invocations (see vercel.json).

## Billing (Dodo Payments)
- [ ] `DODO_PAYMENTS_API_KEY`
- [ ] `DODO_PAYMENTS_WEBHOOK_KEY`
- [ ] `DODO_PAYMENTS_ENVIRONMENT` — set to `live_mode` for production
- [ ] `DODO_PAYMENTS_RETURN_URL`
- [ ] Create "Xoopa Starter" product — $19.00 USD/month recurring subscription
- [ ] Create "Xoopa Pro" product — $49.00 USD/month recurring subscription
- [ ] `DODO_STARTER_PRODUCT_ID` — paste after creating the Starter product above
- [ ] `DODO_PRO_PRODUCT_ID` — paste after creating the Pro product above
- [ ] Dodo Dashboard → Settings → Business → enable **Adaptive Currency** (auto-detects customer's country at checkout, charges in their local currency — e.g. GBP for UK customers — at live exchange rates, zero code required)
- [ ] Decide on Adaptive Currency's **Fees Inclusive** sub-toggle: off (default) means the customer pays a 2-4% FX fee on top of the local-currency price; on means you absorb it out of settlement instead so the customer sees a cleaner number. Recommendation: leave off for now (matches how most bootstrapped SaaS handle this), revisit if conversion data suggests otherwise.
  Gates: checkout route (src/app/checkout/route.ts), customer portal (src/app/customer-portal/route.ts), webhook handler (src/app/api/webhook/dodo-payments/route.ts).
  NOTE: the pricing page itself displays USD prices with a note that billing happens in the customer's local currency at checkout — it does not attempt to show a pre-converted local-currency estimate, to avoid a displayed price drifting from what Dodo actually charges (see docs/deferred-work.md for the reasoning if it's logged there).

---
Once the above are set in Vercel's environment variables and a deploy has run, the app uses live data paths end to end.
