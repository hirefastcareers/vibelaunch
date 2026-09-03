# Sorano handover for the next agent

Claude Project instructions (short brief): `docs/claude-project.md`.  
Wiring checklist: `docs/wiring-checklist.md`.  
Deferred issues: `docs/deferred-work.md`.  
Deployments: `docs/deployments.md`.

---

## What we are trying to achieve

Sorano is **autonomous growth for indie builders**. A solo founder ships a feature, spends about 40 seconds in the product, and the system turns that update into:

1. X posts / threads  
2. A Google-indexable article  
3. UI media (screenshots / capture)  
4. A check of whether ChatGPT / Perplexity / Claude cite them  

It then learns which posts actually performed (ERI) and writes the next ones better (pgvector reinforcement).

**We are not building another social scheduler, AI writer, SEO research suite, or CMS.** Those already exist and are better funded. We are collapsing five tools into one closed loop:

> capture the update → distribute it → measure it → feed the score back into generation → get cited by AI search

**Success looks like:** one X login, one product URL, then continuous organic growth with almost no weekly work. Posts go out, articles rank, AI engines cite the product, and the next draft is better than the last because ERI and vector reinforcement actually ran.

| | |
|---|---|
| **Product** | Sorano (`sorano.app`) |
| **Repo** | `hirefastcareers/vibelaunch` |
| **Stack** | Next.js 15 App Router, React 19, TypeScript, Prisma 6, PostgreSQL + pgvector, NextAuth v4 (X OAuth 2.0), Upstash QStash, OpenAI, Sharp, Playwright (serverless Chromium), Tailwind, Vitest, Dodo Payments |
| **Target user** | Indie hackers / vibe-coders launching AI-built products who will not stitch Buffer + Typefully + a CMS + Search Console + “are we cited in ChatGPT?” |
| **Pricing intent** | Free / Starter $19 / Pro $49 — cheap enough that a solo founder skips the $130–400/mo SEO+GEO stack |

**Writing rule (project-wide):** never use em dashes. Use commas, periods, colons, or a regular hyphen.

**Canonical spec:** `.cursor/rules/vibelaunch-spec.mdc`  
**Agent memory:** `.memory-bank/`  
**Schema:** `prisma/schema.prisma`

---

## Competitive landscape (research, 2026)

The market splits into four categories. Sorano sits in a fifth that almost nobody owns for indie founders.

### 1. Traditional SEO suites

| Examples | Ahrefs, Semrush, SE Ranking, Mangools |
|---|---|
| **Job** | Keyword research, backlinks, rank tracking, site audits |
| **Price** | ~$65–250+/mo for serious use |
| **Strength** | Best-in-class research data |
| **Gap** | They tell you what to do. They do not turn a product update into posts, articles, and citations for you. |

**Implication:** Do not try to beat Ahrefs on backlink graphs. Use free GSC + light keyword intent later if needed. Sorano wins on **execution**, not research depth.

### 2. GEO / AEO visibility trackers

| Examples | AthenaHQ, Profound, Writesonic AEO, Otterly, Scrunch, AIclicks |
|---|---|
| **Job** | Track brand mentions / citations across ChatGPT, Perplexity, Gemini, Claude, AI Overviews, etc. |
| **Price** | Often $99–400+/mo; enterprise custom |
| **Strength** | Deep prompt tracking, share of voice, sentiment, competitor gaps, multi-engine coverage |
| **Gap** | Mostly **watch**. Few auto-ship content from *your* product updates. Built for marketing teams, not one founder who just shipped a feature. |

**Implication:** Match “good enough” tracking for indie prompts (ChatGPT, Perplexity, Claude first). Beat them on **cited → not cited → auto-create the fix content**. Google AI Overviews has no clean official API (see `docs/deferred-work.md`); only add via third-party SERP if demand justifies cost/risk.

### 3. X / social growth tools

| Examples | Typefully, Buffer, Hypefury, Taplio (LinkedIn-first) |
|---|---|
| **Job** | Write, schedule, engage, light analytics |
| **Price** | ~$6–70/mo |
| **Strength** | Great editors, scheduling, engagement workflows |
| **Gap** | No SEO changelog + Google indexing + AI citation loop from the same update. No cross-channel learning memory. |

**Implication:** Do not out-editor Typefully. Win on **update-driven generation + ERI reinforcement + SEO/GEO from the same ship**.

### 4. AI writers / CMS / changelog tools

| Examples | Jasper-class writers, Notion, standalone changelog CMSs |
|---|---|
| **Job** | Draft copy or host pages |
| **Gap** | No closed learn loop across X + SEO + GEO. |

### Where Sorano’s wedge is

| Competitor type | They optimize | Sorano’s bet |
|---|---|---|
| Ahrefs / Semrush | Research | Ship and learn |
| Athena / Profound | Monitor AI citations | Monitor **and** auto-publish to improve citations |
| Typefully / Buffer | Schedule social | Social + SEO article + media + GEO from one update |
| AI writers | Draft text | Draft → publish → measure → reinforce |

**Positioning line:**  
*The autonomous growth engine for indie founders who ship — not another dashboard for marketers who research.*

**“Best SEO + GEO + X tool” for us means:** best **autonomous loop for shipping founders**, not best research suite on earth. Trying to be mini-Ahrefs + mini-Athena + mini-Buffer at once loses the wedge.

---

## Direction: how to become the best (for our ICP)

### North-star product principles

1. **Closed loop over feature checklist.** Every feature must feed capture → distribute → measure → reinforce → cite.  
2. **Honesty over marketing claims.** Only sell what runs in production. Stubs kill trust.  
3. **Indie time-to-value.** One X login + one URL. Weekly work near zero.  
4. **Actionable GEO.** Citation gaps create posts/articles/schema, not just red scores.  
5. **Visible learning.** Show that today’s draft used hooks from the founder’s top ERI posts.  
6. **Stay narrow on channels.** X + Google pages + AI search first. LinkedIn, teams, agencies later (if ever).

### What “best” looks like in 12 months (outcome definition)

A founder can truthfully say:

- “I pasted two lines about what I shipped.”  
- “Sorano posted to X, published a changelog article, captured UI media, and checked three AI engines.”  
- “When ChatGPT stopped citing me, Sorano drafted the fix content without me opening five tabs.”  
- “This week’s posts are better than last month’s because the system learned.”  
- “I pay less than one Ahrefs seat.”

### Moat (hard for big suites to copy)

- **Product-update-native workflow** (not keyword-native)  
- **Cross-channel memory** (X ERI ↔ SEO pages ↔ GEO prompts in one project)  
- **Reinforcement loop** (pgvector + ERI) that improves drafts without a growth hire  
- **Price + taste** for solo builders ($0–49), not enterprise procurement  

### Anti-goals (do not do until the loop is honest)

- Becoming a general SEO research suite  
- Multi-network social (IG/TikTok/etc.)  
- Teams / agencies / white-label  
- Chasing 10 AI engines before ChatGPT + Perplexity + Claude are rock solid  
- New channels (LinkedIn) before X + SEO + GEO loop is production-true  

---

## Product roadmap (P0 → P2)

Priorities are ordered for **becoming the best loop**, not for adding surface area.

### P0 — Make the sold loop real (truth + reliability)

**Goal:** Everything the landing page promises for the core loop works with live keys, or the claim is removed.

| # | Work | Why |
|---|---|---|
| P0.1 | Finish **production wiring** (`docs/wiring-checklist.md`): Postgres+pgvector, X OAuth, OpenAI, QStash, Blob, crons, Dodo, Google Indexing | Without this, nothing compounds |
| P0.2 | Prove **Command Center truth**: empty/503 when integrations missing; live stats when wired. No fake dashboards | Trust |
| P0.3 | **Ship-feature pack:** one update → post draft(s) + changelog article + media attach + enqueue GEO check | This is the product |
| P0.4 | **ERI cron + reinforcement** visible in UI (“used your top posts”) | Learning is the moat |
| P0.5 | **GEO live keys** path (OpenAI / Perplexity / Anthropic) with clear simulated vs live labeling | Stop lying about citations |
| P0.6 | **Media honesty:** Playwright capture exists; video→X (webm/mp4) is still deferred — do not oversell video-on-X until `docs/deferred-work.md` is resolved. Screenshots/code cards must work end-to-end with Blob | Landing still sells Playwright |
| P0.7 | **Replies feed:** currently returns `{ feeds: {}, configured: false }`. Either ship a real X mentions/replies path or remove from marketing/sidebar until ready | Honesty |

**Exit criteria:** A new user with live env can onboard a URL, generate from an update, publish to X, publish a changelog page, run a citation check, and see ERI move after cron — without demo lies.

### P1 — Deepen the loop (differentiation)

**Goal:** Become clearly better than “Typefully + a GEO tracker + a changelog” stitched together.

| # | Work | Why |
|---|---|---|
| P1.1 | **Prompt library per project** (tracked “best tools for X” queries) with weekly sweeps | GEO productization |
| P1.2 | **Gap → action:** when not cited, auto-suggest / auto-draft article or post targeting that prompt | Beat pure trackers |
| P1.3 | **Competitor share of voice** on the same prompts (lightweight, not Athena-scale) | Makes GEO actionable |
| P1.4 | **SEO quality bar:** schema, internal links, index status, Search Console-ish feedback on changelog pages | Earn “SEO” in the name |
| P1.5 | **ERI-aware generator UX:** show which reinforced posts influenced the draft; allow pin/ban hooks | Visible learning |
| P1.6 | **Diagnostics → fix path:** App Health tells you which loop stage failed and how to unblock | Autonomy |

**Exit criteria:** “Not cited on prompt P” reliably produces a draft asset within the product, and founders can see week-over-week citation + ERI improvement.

### P2 — Category leadership (only after P0–P1)

| # | Work | Why |
|---|---|---|
| P2.1 | Citation **source** analysis (which URLs AI leans on in your category) | Matches where GEO market is going |
| P2.2 | Optional Google AI Overviews via paid SERP provider if demand + budget clear | Marketing pressure, deferred for ToS/cost |
| P2.3 | Stronger media (mp4 for X, better capture of “screens this update touched”) | Completes the four-channel pack |
| P2.4 | Smart replies that actually grow distribution (real feed + tone-matched drafts) | X growth depth |
| P2.5 | Light research assists (topic gaps from GSC / scraped SERPs) **without** becoming Semrush | SEO credibility |
| P2.6 | Consider LinkedIn **only** if ICP demands it and X loop is saturated | Channel expansion |

---

## Product loop (canonical)

1. Founder signs in with X (or demo credentials when keys/DB missing).  
2. Onboards a product URL. Scraper pulls title, description, keywords, tone.  
3. Generator drafts posts/threads from that context **plus** similar high-ERI posts in pgvector.  
4. Posts go into a QStash queue, get media processed for X limits, then publish.  
5. Cron pulls X metrics, computes **ERI**, marks high performers as `reinforced`.  
6. The next generation query uses those reinforced embeddings.  
7. The same update can be expanded into a public `/changelog/[slug]` page, sitemap, Google Indexing API.  
8. GEO layer asks ChatGPT / Perplexity / Claude “best tools for X” and records whether the project is cited.  
9. Diagnostic agent audits SEO, the feedback loop, media, and GEO, and writes `TestRun` rows.

Landing promise to protect: **~40 seconds of founder time per shipped feature**, four channels from one update (X, article, media, AI search), weekly engine sweeps, one login instead of a five-tool stack.

---

## Phases (engineering status — refresh as you ship)

Spec numbers **1, 2, 3, 4, 6, 7**. Phase 5 in the codebase is Command Center / onboard / media / replies between SEO and GEO.

| Phase | Status (as of handover rewrite) |
|---|---|
| 1 Foundation | Implemented (Prisma, pgvector, X OAuth, projects, demo mode) |
| 2 Publishing | Implemented (Sharp, QStash, X publish + token refresh hardened) — production-proven only when env is live |
| 3 Analytics + AI | Implemented (ERI cron, reinforcement, adaptive generator) |
| 4 SEO | Implemented (expander, changelog pages, sitemap, Google Indexing) |
| 5 Surface | UI + APIs exist. Media capture code is real (Playwright/Blob); video→X still incomplete. Replies feed not configured. |
| 6 GEO | Implemented; simulates without provider keys. Engines: ChatGPT, Perplexity, Claude. AI Overviews deferred. |
| 7 Diagnostics | Implemented (suites + cron + UI) |
| Billing | Implemented (Dodo, Free/Starter/Pro, usage caps). Product IDs via env. |
| Design | Marketing + much of app on **Satoshi** + soft grey/orange system. Old `docs/design.md` paper/ink notes are obsolete; follow current `globals.css` / landing patterns. |

### Still weak / deferred (see also `docs/deferred-work.md`)

- Video recording outputs WebM; X needs mp4 + chunked upload — not wired  
- Google AI Overviews — no official API; deferred  
- Replies feed — empty / not configured  
- Full production env may still be incomplete (treat `docs/wiring-checklist.md` as source of truth)  

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

Auth env fallbacks live in `src/lib/env.ts` (`ensureAuthEnv`) so Vercel builds do not die on empty `NEXTAUTH_URL` / `NEXTAUTH_SECRET`.

Required env: see `.env.example` and `docs/wiring-checklist.md`.

**Deploy:** Vercel. Preview = PR branches. Production = merge to `main`. Cloud Agent `cursor/*` PRs can auto-ship when ready (see `docs/deployments.md`).

---

## Repo map (high level)

```
src/app/          # marketing, auth, onboard, changelog, dashboard, APIs
src/lib/          # auth, generator, media, queue, seo, geo, diagnostics, billing, x, vector
src/components/   # ui, home/*, dashboard shells, billing notices
prisma/schema.prisma
docs/             # handover, wiring, deferred, deployments
.memory-bank/
.cursor/rules/vibelaunch-spec.mdc
```

### Product language (sidebar)

Command Center, AI Post Generator & Hooks, Auto-Published Articles, AI Search (ChatGPT/Perplexity), Smart Replies, App Health & Audits, Onboard Project, Billing.

### Architecture patterns (do not reinvent)

1. **Auth then Prisma.** Session-gated APIs. Missing integrations → empty or 503, not fake success.  
2. **Publish:** Post → QStash → `/api/queue/process` → `publishToX` → embedding.  
3. **Learn:** cron metrics → ERI → reinforce ≥ 2.0 → `findSimilarPosts`.  
4. **SEO:** `POST /api/seo/publish` → expand → `ChangelogEntry` → index → sitemap.  
5. **GEO:** `checkLLMCitations(projectId)` → one `GeoMetric` per (prompt × provider).  
6. **Diagnostics:** `runFullDiagnosticSuite` → `TestRun`.  
7. **Billing:** plan limits gate projects/posts; Dodo webhook updates tier.

---

## Immediate next work

Unless the user says otherwise, execute **P0** in order. Do not start P2 ideas (new engines, LinkedIn, research suite features) until P0 exit criteria are met.

If you only have one session: pick the highest P0 item that is still false in production (usually wiring + ship-feature pack UX + GEO live labeling).

---

## Conventions

- Path alias: `@/` → `src/`  
- `export const dynamic = "force-dynamic"` on anything that reads session/DB  
- Next 15 `params` are `Promise<{ … }>`  
- Prefer existing files over new abstractions  
- Copy: specific and slightly dry. No “10,000+ founders”, no fake logos  
- Never use em dashes  

---

## One-line summary

Sorano wins by being the **best autonomous X + SEO + GEO loop for indie shippers** — not by out-researching Ahrefs or out-tracking Athena. Make the loop true (P0), make gaps auto-fix themselves (P1), then deepen category leadership (P2).
