import type { CitationModel } from "@prisma/client";
import {
  CITATION_MODEL_LABELS,
  CITATION_MODELS,
} from "@/lib/geo/citation-analytics";
import { prisma } from "@/lib/prisma";

/** Look-back window for mention-rate gaps (successful runs only). */
export const GAP_LOOKBACK_RUNS = 5;

/** Mention rate below this (0–100) counts as a gap when enough runs exist. */
export const GAP_MENTION_RATE_THRESHOLD = 50;

export type CitationGap = {
  trackedQueryId: string;
  brandName: string;
  promptText: string;
  model: CitationModel;
  modelLabel: string;
  /** Successful runs considered (≤ GAP_LOOKBACK_RUNS). */
  runsConsidered: number;
  mentioned: number;
  mentionRate: number;
  /** True when the latest successful run did not mention the brand. */
  latestMissed: boolean;
  latestRunAt: string;
  reason: "latest_miss" | "low_rate" | "both";
};

/**
 * Surface citation gaps for a user.
 *
 * A gap for (TrackedQuery, model) exists when there is ≥1 successful run and:
 * - the most recent successful run has brandMentioned=false, OR
 * - mention rate over the last GAP_LOOKBACK_RUNS successful runs is
 *   &lt; GAP_MENTION_RATE_THRESHOLD.
 *
 * Failed runs (error set) are excluded — we never invent gap/mention stats.
 */
export async function listCitationGaps(userId: string): Promise<CitationGap[]> {
  const queries = await prisma.trackedQuery.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "desc" },
    include: {
      runs: {
        where: { error: null },
        orderBy: { runAt: "desc" },
        take: GAP_LOOKBACK_RUNS * CITATION_MODELS.length,
        select: {
          model: true,
          brandMentioned: true,
          runAt: true,
        },
      },
    },
  });

  const gaps: CitationGap[] = [];

  for (const query of queries) {
    for (const model of CITATION_MODELS) {
      const modelRuns = query.runs
        .filter((r) => r.model === model)
        .slice(0, GAP_LOOKBACK_RUNS);

      if (modelRuns.length === 0) continue;

      const latest = modelRuns[0]!;
      const mentioned = modelRuns.filter((r) => r.brandMentioned).length;
      const mentionRate = Math.round((mentioned / modelRuns.length) * 100);
      const latestMissed = !latest.brandMentioned;
      const lowRate = mentionRate < GAP_MENTION_RATE_THRESHOLD;

      if (!latestMissed && !lowRate) continue;

      const reason: CitationGap["reason"] =
        latestMissed && lowRate
          ? "both"
          : latestMissed
            ? "latest_miss"
            : "low_rate";

      gaps.push({
        trackedQueryId: query.id,
        brandName: query.brandName,
        promptText: query.promptText,
        model,
        modelLabel: CITATION_MODEL_LABELS[model],
        runsConsidered: modelRuns.length,
        mentioned,
        mentionRate,
        latestMissed,
        latestRunAt: latest.runAt.toISOString(),
        reason,
      });
    }
  }

  return gaps.sort((a, b) => a.mentionRate - b.mentionRate);
}
