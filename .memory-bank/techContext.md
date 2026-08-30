# Tech Context

## Dependencies

| Package | Purpose |
|---------|---------|
| next@15 | App framework |
| prisma@6 | ORM with pgvector |
| next-auth@4 | X OAuth |
| @upstash/qstash | Post queue |
| openai | Embeddings + generation |
| sharp | Media processing |
| zod | Input validation |
| vitest | Unit testing |

## Database

PostgreSQL with `vector` extension. Enable before first migration:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Prisma preview feature: `postgresqlExtensions`

## Environment Variables

| Variable | Required | Phase |
|----------|----------|-------|
| DATABASE_URL | Yes | 1 |
| NEXTAUTH_URL | Yes | 1 |
| NEXTAUTH_SECRET | Yes | 1 |
| X_CLIENT_ID | Yes | 1 |
| X_CLIENT_SECRET | Yes | 1 |
| QSTASH_TOKEN | Prod | 2 |
| QSTASH_CURRENT_SIGNING_KEY | Prod | 2 |
| QSTASH_CALLBACK_URL | Prod | 2 |
| OPENAI_API_KEY | Optional | 3 |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Optional | 4 |
| GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY | Optional | 4 |
| APP_URL | Yes | All |
| CRON_SECRET | Prod | 3 |

## Commands

```bash
npm install
npx prisma generate
npm run db:push      # requires DATABASE_URL
npm run dev          # local dev
npm test             # vitest
npm run build        # production build
```

## Deployment Notes

- Vercel recommended for Next.js hosting
- Use Neon or Supabase for PostgreSQL with pgvector
- Configure QStash callback URL to production domain
- Set up Vercel Cron for `/api/cron/eri` (daily)
