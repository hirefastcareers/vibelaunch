# Active Context

## Current State (2026-08-30)

Full platform implemented from scratch. Repo was empty (README only) before this build.

## What's Built

| Phase | Status | Key Files |
|-------|--------|-----------|
| 1 — Prisma + X OAuth + Projects | ✅ | `prisma/schema.prisma`, `src/lib/auth.ts`, `src/app/api/projects/` |
| 2 — Media + QStash + X Publish | ✅ | `src/lib/media/`, `src/lib/queue/`, `src/lib/x/publish.ts` |
| 3 — ERI + Vectors + Generator | ✅ | `src/lib/analytics/`, `src/lib/vector/`, `src/lib/generator/` |
| 4 — SEO + Changelog + Sitemap | ✅ | `src/lib/seo/`, `src/app/changelog/`, `src/app/api/seo/publish/` |

## Next Steps (for future agents)

1. Wire up a real PostgreSQL instance with pgvector and run `prisma db push`
2. Configure X OAuth app credentials in `.env`
3. Set up Upstash QStash for production queue
4. Add integration tests with test database
5. Add Vercel cron for `/api/cron/eri`

## Known Limitations

- Embedding storage uses raw SQL (pgvector Unsupported type)
- Google indexing requires service account setup
- X media upload uses v1.1 endpoint (required for media)
- No SessionProvider wrapper (sign-in works via client-side signIn)
