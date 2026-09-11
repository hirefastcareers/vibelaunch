# Xoopa GEO roadmap

Product direction: GEO / AI-citation tracking — whether a brand is mentioned across major AI models, tied to a content-fix workflow.

Status reflects what has shipped on the active GEO PR lineage (Phases 1–12).

**Roadmap status:** Phases 1–12 of the original GEO plan are present on this integration review tip.

| Phase | Name | Status |
| ----- | ---- | ------ |
| 1 | Rename & scope strip / schema foundation | Complete |
| 2 | Live citation tracking (5 models) | Complete |
| 3 | Query library & onboarding | Complete |
| 4 | Competitor comparison | Complete |
| **5** | **Sentiment classification** | **Complete** |
| **6** | **“Fix it” content loop** | **Complete** |
| **7** | **Real per-tier commercial limits** | **Complete** |
| **8** | **Public marketing site** | **Complete** |
| **9** | **Public shareable AI visibility scorecard** | **Complete** |
| **10** | **“Did the fix work” outcome loop** | **Complete** |
| **11** | **“Why wasn’t I cited” analysis** | **Complete** |
| **12** | **Change alerts** (email/webhook) | **Complete** |

## Phase 12 — Change alerts (complete)

- After each successful citation run, compare to the previous successful same-model run.
- Detect: citation lost / gained, competitor overtake, positive→negative sentiment flip.
- **2-run confirmation** before creating an `Alert` (single-run flips are noise).
- Storage: `Alert`, `AlertPreference` (default digest **WEEKLY**), `AlertPendingChange`.
- Email: **no mail provider wired** — delivery records an explicit skip. Do not add a provider without Tom choosing one.
- Webhooks: optional URL; SSRF-guarded; retry + circuit; **Starter/Pro only**.
- In-app: Alerts bell + `/dashboard/alerts` feed + settings.
- Weekly digest cron: `/api/cron/alert-digest` Mondays 07:00 UTC.

## Notes

- Honesty discipline: no phase is marked complete if it still relies on silent simulation for its core function.
- Log deferred items in `docs/deferred-work.md`.

## Review decisions (2026-09-11)

- [x] Remove legacy Geo tracker (GeoCard / citation-tracker / geo check+metrics APIs)
- [x] QStash workers fail-closed in all environments
- [x] Webhook DNS re-validation at send time
- [x] Public scorecard: anonymized competitor rank only
