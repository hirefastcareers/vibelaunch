# Sorano.app

Autonomous growth and GEO engine — continuous organic growth, Playwright UI media capture, social-to-static SEO, and Generative Engine Optimization.

## Features

- **X OAuth** — Sign in with your X account
- **Project Management** — Create and manage launch projects
- **Post Queue** — Schedule and publish posts via QStash
- **Media Engine** — Process images for X constraints
- **ERI Analytics** — Track engagement rate index across posts
- **Adaptive Generator** — AI content inspired by top-performing posts
- **SEO Changelog** — Publish changelog pages with Google indexing

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Push schema to database (requires PostgreSQL with pgvector)
npm run db:push

# Run development server
npm run dev
```

## Testing

```bash
npm test
npm run build
```

## Architecture

See `.cursor/rules/vibelaunch-spec.mdc` for the full platform specification and `.memory-bank/` for project context.

## Phases

| Phase | Description |
|-------|-------------|
| 1 | Prisma + pgvector, X OAuth, project CRUD |
| 2 | Media engine, QStash post queue, X publish |
| 3 | ERI analytics cron, vector reinforcement, adaptive generator |
| 4 | SEO expander, changelog pages, sitemap, Google indexing |

## License

Private — hirefastcareers/vibelaunch
