# Deployments

Sorano deploys through Vercel's GitHub integration.

## How it works

| Stage | Trigger | Where it shows up |
|-------|---------|-------------------|
| **Preview** | Push to any branch with an open PR | `vibelaunch-git-<branch>-<team>.vercel.app` |
| **Production** | Merge (or push) to `main` | Production domain (e.g. `sorano.app`) |

Pushing to a feature branch **does not** update production. Only `main` does.

## Common gotchas

1. **Draft PRs** — Vercel still builds previews, but draft PRs are easy to miss in the GitHub UI. Mark PRs "Ready for review" when work is done.
2. **Preview login wall** — If Vercel Deployment Protection is enabled, preview URLs require authentication. To share previews publicly, either:
   - Add the preview domain under **Deployment Protection → Exceptions** in the Vercel project settings, or
   - Share a bypass link using `?x-vercel-protection-bypass=<secret>` (secret from Vercel → Settings → Deployment Protection).
3. **Production lag** — After merging to `main`, allow 1–2 minutes for the production deployment to finish. Check the Vercel dashboard or the commit status on `main`.

## Cloud Agent PRs

PRs from branches matching `cursor/*` are auto-merged to `main` once the Vercel check passes and the PR is not a draft. That triggers the production deploy without manual merge steps.

To keep a PR in preview only, leave it as a **draft** or use a branch name that does not start with `cursor/`.

## Manual deploy check

```bash
# Preview URL for an open PR (from the Vercel bot comment on the PR)
# Production: merge to main, then confirm on GitHub → main → latest commit → Vercel check

gh api repos/hirefastcareers/vibelaunch/commits/main/status \
  --jq '.statuses[] | select(.context=="Vercel") | {state, description, target_url}'
```

## Required Vercel env

See `vercel.env.example` for production environment variables. A successful build does not guarantee a healthy runtime — missing `DATABASE_URL`, auth secrets, etc. can cause 500s on production even when deploy succeeds.
