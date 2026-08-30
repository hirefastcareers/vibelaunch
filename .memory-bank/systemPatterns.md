# System Patterns

## Architecture

```
User → Next.js App Router
         ├── NextAuth (X OAuth) → Prisma → PostgreSQL
         ├── API Routes
         │     ├── /api/projects     (CRUD)
         │     ├── /api/posts        (create + publish queue)
         │     ├── /api/queue/process (QStash webhook)
         │     ├── /api/cron/eri     (analytics cron)
         │     ├── /api/generate     (adaptive content)
         │     └── /api/seo/publish  (changelog + indexing)
         └── Pages
               ├── /dashboard
               ├── /changelog/[slug]
               └── /sitemap.xml
```

## Key Patterns

### Auth
- Database sessions via NextAuth + PrismaAdapter
- `getSession()` / `requireAuth()` helpers in `src/lib/session.ts`
- All API routes check session before data access

### Queue
- Posts enqueued via QStash with optional `notBefore` for scheduling
- Webhook at `/api/queue/process` verifies signature, publishes to X, stores embedding

### Vector Reinforcement
1. Post published → embedding stored
2. Cron fetches X metrics → calculates ERI
3. High-ERI posts (≥2.0) → embeddings marked `reinforced`
4. Generator queries similar reinforced embeddings for inspiration

### SEO Pipeline
1. `POST /api/seo/publish` with title + summary
2. SEO expander generates full body + meta
3. ChangelogEntry created and published
4. Google Indexing API notified
5. Entry appears in `/sitemap.xml`

## Validation
- Zod schemas in `src/lib/validators.ts`
- All API inputs validated before processing

## Testing
- Vitest for unit tests (ERI, media, validators, SEO)
- No integration tests yet (requires database)
