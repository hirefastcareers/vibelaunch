# Xoopa.app

GEO and AI citation tracking - know whether ChatGPT, Perplexity, Claude, and Gemini cite your brand, and ship citeable product updates from one workspace.

## Features

- **AI Citation Tracking** - Track brand mentions across AI search engines (demo stub gated by `isDemoMode()`)
- **X as a distribution channel** - Sign in with X and publish updates (not an engagement-growth suite)
- **Project Management** - Create and manage products and tracked topics
- **Post Queue** - Schedule and publish posts via QStash
- **Media Engine** - Process images for X constraints
- **Citeable content generation** - AI drafts oriented toward AI-search citation, not viral hooks
- **SEO Changelog** - Publish changelog pages with Google indexing

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

See `.cursor/rules/vibelaunch-spec.mdc` for the platform specification and `.memory-bank/` for project context. Phase 1 GEO pivot notes live in `docs/deferred-work.md`.

## Deployments

Xoopa uses Vercel. **Preview** deploys run on PR branches; **production** deploys only from `main` after merge.

Cloud Agent PRs on `cursor/*` branches auto-merge to `main` once Vercel checks pass (see `.github/workflows/auto-ship-cursor-prs.yml`). Leave a PR as **draft** if you only want a preview.

Full details: [docs/deployments.md](docs/deployments.md)

## Writing

Never use em dashes (—). Prefer commas, periods, colons, or a regular hyphen (-).

## License

Private - hirefastcareers/vibelaunch
