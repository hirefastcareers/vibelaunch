# What we are trying to achieve

Paste this into the Claude Project instructions. Full engineering context is in `docs/handover.md`.

---

Sorano is **autonomous growth for indie builders**. A solo founder ships a feature, spends about 40 seconds in the product, and the system turns that update into X posts, a Google-indexable article, UI media, and a check of whether ChatGPT / Perplexity / Claude cite them. It then learns which posts actually performed and writes the next ones better.

We are not building another social scheduler, AI writer, or CMS. Those already exist. We are collapsing five tools into one closed loop: **capture the update → distribute it → measure it → feed the score back into generation → get cited by AI search**.

**Who it is for:** indie hackers and vibe-coders launching AI-built products. They do not have a growth person. They will not stitch Buffer, Typefully, a changelog CMS, Search Console, and a spreadsheet that tracks "did ChatGPT mention us."

**The north star:** one X login, one product URL, then continuous organic growth with almost no weekly work. Success looks like: posts go out, articles rank, AI engines cite the product, and the next draft is better than the last because ERI (engagement rate index) and pgvector reinforcement actually ran.

**Where we are:** phases 1–7 of the engine exist (auth, queue, publish, ERI learning, SEO changelog, GEO citation checks, diagnostic agent). Demo mode can walk the whole dashboard without a database. Several promised pieces are still fake: Playwright capture, code cards, the replies feed, Google AI Overviews. The marketing site uses the paper/ink design system. The dashboard still looks like a dark admin panel.

**What to do next (in order):** make the product honest. Apply the design system to the authenticated app. Replace stubs with real capture or stop claiming them. Wire production (Postgres + pgvector, QStash, Vercel crons, real X). Do not add billing, teams, or new channels until the loop we already sell actually works.

**How to write and build:** never use em dashes. Specific, dry copy. Hairlines not cards, one orange accent, no purple/glow/gradient slop. Demo-gate APIs first (`isDemoMode()` then live). Follow `docs/design.md` and `.cursor/rules/vibelaunch-spec.mdc`.
