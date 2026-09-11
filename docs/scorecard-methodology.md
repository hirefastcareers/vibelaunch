# AI visibility scorecard methodology

Phase 9 public scorecards expose a single headline score (0–100) plus supporting
breakdowns. The formula is intentionally simple and auditable.

## Headline score

1. Consider only **successful** `CitationRun` rows (`error` is null).
2. For each AI model with at least one successful run, compute:

   `mentionRate = round(100 × brandMentionedCount / successfulRunsForModel)`

3. Headline score:

   `score = round(average(mentionRate across models that have data))`

Models with **zero** successful runs are **excluded** from the average (they are
not treated as 0%). Failed API calls never inflate or deflate the score.

## Minimum data gate

A numeric score is shown only when **both** are true:

- at least **10** successful runs in total
- at least **2** models with ≥1 successful run

Otherwise the public page states that there is not enough data yet. We never
show a confident score on a thin sample.

## Sentiment

Sentiment pills count only runs where the brand was mentioned. Unclassified
mentions stay unclassified (null classifier results are not relabeled as neutral).

## Competitor ranking (public vs private)

Ranks reuse stored raw responses (same approach as the dashboard Compare tab).

**Public `/score/[slug]` page:** shows only an **anonymized** rank for the
scorecard brand (e.g. “ranked #2 of 4 tracked brands”). Other competitor brand
names, per-competitor mention rates, and named ranking tables are **not**
exposed. Prompts, raw model text, cited URL lists, and account/billing fields
remain private.

**Private dashboard (Phase 4 Compare):** still shows competitor names and
aggregate mention rates for the signed-in user.

## Tuning

Weights and thresholds may change after we see real production distributions.
See `docs/deferred-work.md` (score formula tuning).
