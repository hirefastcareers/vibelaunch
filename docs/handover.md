# Sorano handover for the next agent

Claude Project instructions (the brief "what we are trying to achieve"): `docs/claude-project.md`.

## What we are trying to achieve

Sorano is autonomous growth for indie builders. A solo founder ships a feature, spends about 40 seconds in the product, and the system turns that update into X posts, a Google-indexable article, UI media, and a check of whether ChatGPT / Perplexity / Claude cite them. It then learns which posts actually performed and writes the next ones better.

We are not building another social scheduler, AI writer, or CMS. We are collapsing five tools into one closed loop: capture the update, distribute it, measure it, feed the score back into generation, get cited by AI search.

Success: one X login, one product URL, then continuous organic growth with almost no weekly work. Posts go out, articles rank, AI engines cite the product, and the next draft is better than the last because ERI and vector reinforcement actually ran.

**Product name:** Sorano (`sorano.app`)
**Repo:** `hirefastcareers/vibelaunch`
**Local path:** `c:\Users\tomfo\Sorano\vibelaunch`
**Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma 6, PostgreSQL + pgvector, NextAuth v4 (X OAuth 2.0), Upstash QStash, OpenAI, Sharp, Tailwind, Vitest

**Target user:** indie hackers / vibe-coders launching AI-built products who do not want to stitch Buffer + Typefully + a CMS + Search Console + "are we cited in ChatGPT?"

**Writing rule (project-wide):** never use em dashes. Use commas, periods, colons, or a regular hyphen.

**Canonical spec:** `.cursor/rules/vibelaunch-spec.mdc`
**Agent memory:** `.memory-bank/` (`projectbrief.md`, `progress.md`, `activeContext.md`, `techContext.md`, `systemPatterns.md`)
**Design system:** `docs/design.md`
**Schema:** `prisma/schema.prisma`

Latest landing-page commit on `main`: `ec715aa` (`style: tokenize landing colors and stop button hover reflow`). Working tree may still have uncommitted product/API work plus dirty `.next` cache. Do not assume GitHub `main` has every file listed below until you `git status`.

---

## Product loop (the direction)

This is the intended closed loop. Phases 1–7 built the machinery. What remains is making it real in production and making the UI match the marketing site.

1. Founder signs in with X (or demo credentials).
2. Onboards a product URL. Scraper pulls title, description, keywords, tone.
3. Generator drafts posts/threads from that context **plus** similar high-ERI posts in pgvector.
4. Posts go into a QStash queue, get media processed for X limits, then publish.
5. Cron pulls X metrics, computes **ERI**, marks high performers as `reinforced`.
6. The next generation query uses those reinforced embeddings.
7. The same update can be expanded into a public `/changelog/[slug]` page, sitemap, Google Indexing API.
8. GEO layer asks ChatGPT / Perplexity / Claude "best tools for X" and records whether the project is cited.
9. Diagnostic agent audits SEO, the feedback loop, media, and GEO, and writes `TestRun` rows.

Landing page promise (what marketing claims today): **40 seconds of founder time per shipped feature**, four channels from one changelog entry (X, article, media, AI search), three engines swept weekly, one login instead of a five-tool stack.

---

## Phases (what is done vs what is fake)

The spec numbers **1, 2, 3, 4, 6, 7**. There is no Phase 5 heading. In the codebase, Phase 5 is the Command Center / onboard / media-capture / replies layer that sits between SEO and GEO.

### Phase 1 — Foundation — **implemented**

- Prisma + `pgvector` (`vector(1536)` on `PostEmbedding.embedding`). Enable with `CREATE EXTENSION IF NOT EXISTS vector;`
- Models: `User`, `Account`, `Session`, `VerificationToken`, `Project`
- NextAuth Twitter v2: scopes `tweet.read tweet.write users.read offline.access`
- Stores `xUserId` / `xUsername` on User
- Project CRUD: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`
- Demo mode: credentials provider (`demo` / `demo`) when keys/DB are missing

### Phase 2 — Publishing pipeline — **implemented, production-unproven**

- Sharp media engine: `src/lib/media/engine.ts` (4096px, 5MB, JPEG)
- QStash enqueue: `src/lib/queue/qstash.ts`
- Webhook: `POST /api/queue/process` (signature check, publish, store embedding)
- Manual enqueue: `POST /api/posts/[id]/publish`
- X publish + metrics: `src/lib/x/publish.ts` (tweets + media upload v1.1)

### Phase 3 — Analytics and AI — **implemented**

- ERI: `(likes + retweets*2 + replies*1.5 + clicks*0.5) / impressions * 100`
- Cron: `GET /api/cron/analytics` then `reinforceHighPerformingEmbeddings()` (threshold ≥ 2.0). POST is a thin alias for manual/QStash callers.
- Embeddings: `src/lib/vector/embeddings.ts`
- Adaptive generator: `POST /api/generate`, `src/lib/generator/adaptive.ts`, wrapper `src/lib/ai/generator.ts`
- Thread helper: `POST /api/generate/x-thread`

### Phase 4 — SEO — **implemented**

- Expander: `src/lib/seo/expander.ts`
- Public pages: `/changelog/[slug]` with canonical, OG, JSON-LD
- Dynamic sitemap: `src/app/sitemap.ts`
- Google Indexing API via service-account JWT: `src/lib/seo/google-indexing.ts` (re-export `google-index.ts`)
- `POST /api/seo/publish`

### Phase 5 — Command Center, onboard, media capture, replies — **UI + APIs exist, several backends are stubs**

Not numbered in the spec. This is the product surface.

- URL scrape onboard: `POST /api/project/onboard`, `src/lib/scraper/url-scraper.ts`, UI `/onboard`
- Command Center: `/dashboard` (impressions velocity, avg ERI, SEO pages, GEO card, diagnostic card, follower chart)
- Queue UI: `/dashboard/queue`
- Project pages: `/dashboard/projects/new`, `/dashboard/projects/[id]`
- Smart replies UI: `/dashboard/replies`
- Command palette (⌘K)
- Playwright video recorder: **stub** (`src/lib/media/video-recorder.ts` returns placeholder URLs)
- Code-to-PNG: **stub** (`src/lib/media/code-card.ts` returns placeholder URLs)
- Media preview API: `GET/POST /api/media/generate` (GET serves purple SVG placeholders)

### Phase 6 — GEO (Generative Engine Optimization) — **implemented, simulated without extra keys**

- `GeoMetric` model
- Citation tracker queries Perplexity, ChatGPT, Claude: `src/lib/geo/citation-tracker.ts`
- JSON-LD: `SoftwareApplication` + `FAQPage` + `Article` on changelog pages
- Dashboard widget: `src/components/dashboard/geo-card.tsx`
- `GET /api/geo/metrics`, `POST /api/geo/check`
- Falls back to deterministic simulated answers if `PERPLEXITY_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` missing
- Landing also claims **Google AI Overviews**. That provider is **not** in the tracker yet.

### Phase 7 — Autonomous verification / diagnostic agent — **implemented**

- `TestRun` model
- Suites: `seo_audit`, `feedback_loop`, `media_render`, `geo_audit`
- Runner: `src/lib/diagnostics/runner.ts` (parallel, live HTML fetch for SEO)
- Agent wrapper: `src/lib/diagnostics/agent.ts`, public entry `src/lib/agents/tester.ts`
- Cron: `GET /api/cron/diagnostics` (POST alias)
- APIs: `GET /api/diagnostics/runs`, `POST /api/diagnostics/run`, `POST /api/agents/tester`, `POST /api/agent/test`
- UI: `/dashboard/diagnostics` + dashboard `diagnostic-card`

### Phase 8 — **not specified**

Nothing in the spec after 7. Implied next work (in priority order from product intent + stubs):

1. Apply `docs/design.md` to **dashboard, auth, onboard, changelog** (landing is done; dashboard still forces `class="dark"` in `DashboardShell`).
2. Replace Playwright / code-card **stubs** with real capture (Playwright is a landing-page selling point).
3. Real Smart Replies feed (`GET /api/replies/feed` always returns `MOCK_SMART_REPLIES_FEED`).
4. Add Google AI Overviews (or Search) to GEO so the homepage claim is true.
5. Production deploy: Neon/Supabase pgvector, Vercel, real X app, QStash, cron (`vercel.json` schedules `/api/cron/diagnostics` daily and `/api/cron/analytics` every 6 hours).
6. Billing / plans / waitlist: not started. JSON-LD already says "Freemium".
7. Integration tests against a real DB: not started. Vitest is unit-only.

---

## How to run it

```bash
npm install
cp .env.example .env
npx prisma generate
npm run db:push    # needs real DATABASE_URL + pgvector; skip in demo
npm run dev
npm test
npm run build
```

**Demo mode is the default local path.** `isDemoMode()` is true if `NEXT_PUBLIC_DEMO_MODE=true` / `DEMO_MODE=true`, or if `DATABASE_URL` / `OPENAI_API_KEY` / X keys look like placeholders. Demo login: **username `demo`, password `demo`**. APIs return `src/lib/mock-data.ts` with a fake delay.

Auth env fallbacks live in `src/lib/env.ts` (`ensureAuthEnv`) so Vercel builds do not die on empty `NEXTAUTH_URL` / `NEXTAUTH_SECRET`.

Required env (see `.env.example` and `.memory-bank/techContext.md`):

| Var | When |
|-----|------|
| `DATABASE_URL` | live DB |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | always (demo secret exists) |
| `X_CLIENT_ID`, `X_CLIENT_SECRET` | real X login |
| `QSTASH_TOKEN`, signing keys, callback | production queue |
| `OPENAI_API_KEY` | generation, embeddings, ChatGPT GEO |
| `PERPLEXITY_API_KEY`, `ANTHROPIC_API_KEY` | live GEO (optional) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Indexing API |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | canonical URLs |
| `CRON_SECRET` | cron routes |

---

## Repo map

```
src/app/
  page.tsx                    # marketing landing (design system applied)
  layout.tsx                  # Instrument Serif + JetBrains Mono
  globals.css                 # tokens + .ds-* utilities
  sitemap.ts
  auth/signin/
  onboard/
  changelog/[slug]/
  dashboard/                  # Command Center, queue, projects, replies, diagnostics
  api/                        # all backend routes (24 handlers)

src/lib/
  auth.ts session.ts env.ts demo-mode.ts mock-data.ts prisma.ts validators.ts
  analytics/          # ERI + cron
  generator/ adaptive.ts
  ai/ generator.ts vector-store.ts
  media/ engine.ts video-recorder.ts (stub) code-card.ts (stub)
  queue/ qstash.ts
  seo/ expander.ts google-indexing.ts
  geo/ citation-tracker.ts llm-schema.ts analytics.ts
  diagnostics/ runner.ts agent.ts types.ts
  agents/ tester.ts
  vector/ embeddings.ts
  scraper/ url-scraper.ts
  x/ publish.ts

src/components/
  ui/                 # shadcn-ish (button, card, dialog, tabs, …)
  dashboard/          # geo-card, diagnostic-card
  home/platform-tabs.tsx
  sidebar, dashboard-shell, command-palette, generate-post-modal

prisma/schema.prisma
docs/design.md
docs/handover.md
.cursor/rules/vibelaunch-spec.mdc
.memory-bank/
```

### Pages

| Route | Role |
|-------|------|
| `/` | Landing. Server component. CTA → `/auth/signin` or `/dashboard` |
| `/auth/signin` | X OAuth or demo credentials |
| `/onboard` | URL + name + tone + keywords |
| `/dashboard` | Command Center |
| `/dashboard/queue` | Post generator and queue |
| `/dashboard/projects/new`, `/dashboard/projects/[id]` | Project CRUD UI |
| `/dashboard/replies` | Smart replies (mock feed) |
| `/dashboard/diagnostics` | Audit runs |
| `/changelog/[slug]` | Public SEO article |

Sidebar labels (product language, keep this): Command Center, AI Post Generator & Hooks, Auto-Published Articles, AI Search (ChatGPT/Perplexity), Smart Replies, App Health & Audits, Onboard Project.

### API surface

| Method | Path | Purpose |
|--------|------|---------|
| * | `/api/auth/[...nextauth]` | NextAuth |
| GET/POST | `/api/projects` | list / create |
| GET/PATCH/DELETE | `/api/projects/[id]` | project |
| POST | `/api/projects/[id]/posts` | create post |
| POST | `/api/posts/[id]/publish` | enqueue |
| POST | `/api/queue/process` | QStash webhook |
| POST | `/api/project/onboard` | scrape + create |
| POST | `/api/generate` | adaptive post |
| POST | `/api/generate/x-thread` | thread |
| GET/POST | `/api/media/generate` | video/code-card (stub) |
| POST | `/api/seo/publish` | changelog + index |
| GET | `/api/geo/metrics` | citation analytics |
| POST | `/api/geo/check` | live citation scan |
| GET | `/api/replies/feed` | **always mock** |
| POST | `/api/replies/generate` | OpenAI or fallback |
| GET | `/api/dashboard/stats` | Command Center data |
| GET | `/api/dashboard/queue` | queue data |
| GET | `/api/cron/analytics` | ERI + reinforce (POST alias) |
| GET | `/api/cron/diagnostics` | all-project audits (POST alias) |
| GET | `/api/diagnostics/runs` | latest runs |
| POST | `/api/diagnostics/run` | manual scan |
| POST | `/api/agents/tester` | full suite |
| POST | `/api/agent/test` | UI alias |

Auth pattern: `getSession()` / `requireAuth()` in `src/lib/session.ts`. Zod in `src/lib/validators.ts`. Cron uses `Authorization: Bearer $CRON_SECRET`.

### Prisma models (beyond auth)

`Project` (slug unique, status DRAFT/ACTIVE/LAUNCHED/ARCHIVED, tone, keywords[])
`Post` (status DRAFT→QUEUED→SCHEDULED→PUBLISHING→PUBLISHED/FAILED, mediaUrls[], xPostId)
`PostEmbedding` (vector 1536, eriScore, reinforced)
`PostAnalytics` (impressions, likes, retweets, replies, clicks, eri)
`EriSnapshot` (per-project averages)
`ChangelogEntry` (slug, body, seoTitle/seoDesc, published, indexedAt)
`GeoMetric` (queryPrompt, cited, llmProvider, citationUrl)
`TestRun` (suite, status, score, details JSON)

---

## Design system (in progress)

Source: `docs/design.md`. Landing follows it. Dashboard does not, fully.

- Fonts stay `Instrument_Serif` + `JetBrains_Mono` in `layout.tsx`. Do not change fonts.
- Light warm paper, near-black ink, one orange accent (`#FF5500` / `#FF4500` family). `borderRadius: 2px`, `boxShadow: none`.
- **Do not put `class="dark"` on `<html>`.** Dark bands are opt-in sections (`bg-ink`). Dashboard currently still wraps in `<div className="… dark">` in `dashboard-shell.tsx`. That is the next visual job.
- Hairlines, not cards. Two-column section shell (`ds-shell`: 280px index + content). Numbered modules. Orange only on primary CTA, section indices, live markers.
- Banned: gradients, glass, glow, purple, emoji bullets, `rounded-2xl`, invented "Trusted by 10k", marquee logos.
- Tokens live in `globals.css` `:root`. Tailwind maps them in `tailwind.config.ts`. Extra tokens: `--ink-muted` (`#4A453D`), `--surface-muted` (`#C9C3B8`). Utilities: `.ds-container`, `.ds-shell`, `.ds-btn`, `.ds-btn-ink`, `.ds-stripe`, `.ds-label`.
- `.ds-btn` hover is color-only (`hover:bg-accent`), not `hover:font-bold` (that caused layout shift).

Interactive landing tabs: `src/components/home/platform-tabs.tsx` (client). `page.tsx` stays a server component because of `getSession()`.

---

## What is real vs demo vs stub

**Real code paths (work when env is live):** project CRUD, scrape onboard, Sharp image processing, QStash enqueue/process, X publish, ERI math, OpenAI generation + embeddings, SEO expander + changelog + indexing, GEO queries (or simulation), diagnostic HTML audits.

**Demo-first:** almost every API short-circuits via `isDemoMode()` to `mock-data.ts`. You can demo the whole dashboard with no DB.

**Stubs / lies to fix:**

- Playwright video recording (placeholder URL only)
- Code card PNG (placeholder URL only)
- `GET /api/replies/feed` is mock even outside demo
- Media GET placeholders still use purple (`#a78bfa`), which violates the slop list
- No Vercel cron config
- No billing
- Dashboard still dark/stone, not paper/ink
- GEO does not sweep Google AI Overviews despite the homepage

---

## Tests

Vitest, `npm test`. Coverage is unit-level:

- `eri`, `validators`, `env`, `demo-mode`
- `media/engine`
- `seo/expander`
- `geo/citation-tracker`, `geo/analytics`, `geo/llm-schema`
- `diagnostics/runner`, `agents/tester`

No DB integration tests. `npx prisma generate` is required before build.

---

## Architecture patterns (do not reinvent)

1. **Demo gate first, then Prisma.** If you add an API, follow existing `isDemoMode() → mock → live` shape.
2. **Publish pipeline:** create Post → enqueue QStash → `/api/queue/process` verifies → `publishToX` → status PUBLISHED → `storePostEmbedding`.
3. **Learn loop:** cron fetches metrics → ERI snapshot → reinforce embeddings with ERI ≥ 2.0 → generator `findSimilarPosts`.
4. **SEO pipeline:** `POST /api/seo/publish` → expand → `ChangelogEntry` → Google index → sitemap.
5. **GEO:** `checkLLMCitations(projectId)` writes one `GeoMetric` per (prompt × provider).
6. **Diagnostics:** `runFullDiagnosticSuite` in parallel, persist `TestRun`.

---

## Immediate next work (recommended)

In this order unless the user says otherwise:

1. **Design-system the authenticated app.** Port landing tokens to dashboard, sidebar, sign-in, onboard, changelog. Remove `dark` from `DashboardShell`. Replace purple media placeholders. Keep hairlines, 2px radius, no shadows.
2. **Tell the truth on the landing page or implement the missing pieces:** Playwright capture, Google AI Overviews, real replies feed.
3. **Production wiring:** `vercel.json` crons for `/api/cron/analytics` and `/api/cron/diagnostics`, real `DATABASE_URL` with pgvector, QStash callback to prod domain.
4. **Harden X publish** (token refresh, media upload content-type, error surfaces in the queue UI).
5. **Do not** add a new phase-8 product idea (billing, teams, LinkedIn, etc.) until 1–3 are honest.

If you only have one session: start with (1). The landing now sells a paper/ink engine; the product UI still looks like a dark dashboard bolted on.

---

## Conventions

- Path alias: `@/` → `src/`
- `export const dynamic = "force-dynamic"` on anything that reads session/DB
- Next 15 `params` are `Promise<{ … }>` (see changelog page)
- Prefer existing files over new abstractions (`google-index.ts` is already a re-export)
- Copy in UI and landing is specific and slightly dry. No "10,000+ founders", no fake logos.

That is the whole product as it exists today: a working demo of an autonomous X + SEO + GEO loop, with real Prisma/API shapes, a finished marketing page, and a dashboard that still needs the same design system plus a few backends that currently pretend.
