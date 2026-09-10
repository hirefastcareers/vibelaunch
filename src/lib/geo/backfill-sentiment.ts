import { detectBrandMention } from "@/lib/geo/brand-mention";
import { classifyMentionSentiment } from "@/lib/geo/classify-sentiment";
import { prisma } from "@/lib/prisma";

export type SentimentBackfillStats = {
  brandRunsScanned: number;
  brandRunsUpdated: number;
  brandRunsFailed: number;
  competitorMentionsCreated: number;
  competitorMentionsFailed: number;
  done: boolean;
};

const DEFAULT_BATCH = 25;

/**
 * Backfill null brand sentiments + missing competitor mention rows.
 * Intended to run automatically via cron after deploy — not a manual Tom step.
 * Failures leave sentiment null (honesty discipline).
 */
export async function backfillSentimentBatch(
  batchSize = DEFAULT_BATCH
): Promise<SentimentBackfillStats> {
  const stats: SentimentBackfillStats = {
    brandRunsScanned: 0,
    brandRunsUpdated: 0,
    brandRunsFailed: 0,
    competitorMentionsCreated: 0,
    competitorMentionsFailed: 0,
    done: false,
  };

  const brandRuns = await prisma.citationRun.findMany({
    where: {
      brandMentioned: true,
      sentiment: null,
      error: null,
    },
    orderBy: { runAt: "asc" },
    take: batchSize,
    include: {
      trackedQuery: { select: { userId: true, brandName: true } },
    },
  });

  stats.brandRunsScanned = brandRuns.length;

  for (const run of brandRuns) {
    const sentiment = await classifyMentionSentiment({
      brandName: run.trackedQuery.brandName,
      rawResponse: run.rawResponse,
    });
    if (!sentiment) {
      stats.brandRunsFailed += 1;
      continue;
    }
    await prisma.citationRun.update({
      where: { id: run.id },
      data: { sentiment },
    });
    stats.brandRunsUpdated += 1;
  }

  // Competitor backfill: successful runs that lack competitor mention rows yet.
  const runsForCompetitors = await prisma.citationRun.findMany({
    where: {
      error: null,
      rawResponse: { not: "" },
      competitorMentions: { none: {} },
    },
    orderBy: { runAt: "asc" },
    take: batchSize,
    include: {
      trackedQuery: { select: { userId: true } },
    },
  });

  for (const run of runsForCompetitors) {
    const competitors = await prisma.competitorBrand.findMany({
      where: { userId: run.trackedQuery.userId },
      select: { id: true, brandName: true },
    });
    if (competitors.length === 0) continue;

    for (const competitor of competitors) {
      const mentioned = detectBrandMention(
        run.rawResponse,
        competitor.brandName
      );
      if (!mentioned) continue;

      const sentiment = await classifyMentionSentiment({
        brandName: competitor.brandName,
        rawResponse: run.rawResponse,
      });
      if (!sentiment) {
        stats.competitorMentionsFailed += 1;
      }

      try {
        await prisma.citationCompetitorMention.create({
          data: {
            citationRunId: run.id,
            competitorBrandId: competitor.id,
            mentioned: true,
            sentiment,
          },
        });
        stats.competitorMentionsCreated += 1;
      } catch (err) {
        // Unique race / already exists — ignore.
        console.warn(
          "[sentiment-backfill] competitor mention write skipped:",
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  const remainingBrand = await prisma.citationRun.count({
    where: { brandMentioned: true, sentiment: null, error: null },
  });
  stats.done = remainingBrand === 0 && brandRuns.length < batchSize;

  return stats;
}
