import type { CitationModel } from "@prisma/client";
import { detectBrandMention } from "@/lib/geo/brand-mention";
import {
  CITATION_MODEL_LABELS,
  CITATION_MODELS,
} from "@/lib/geo/citation-analytics";
import { prisma } from "@/lib/prisma";

export type CompetitorBrandRow = {
  id: string;
  brandName: string;
  createdAt: string;
};

export type ShareOfVoiceRow = {
  key: string;
  label: string;
  isYou: boolean;
  mentionRate: number;
  mentioned: number;
  total: number;
};

export type CompetitorComparisonData = {
  yourBrand: string | null;
  competitors: CompetitorBrandRow[];
  overall: ShareOfVoiceRow[];
  byModel: Array<{
    model: CitationModel;
    label: string;
    brands: ShareOfVoiceRow[];
  }>;
  /** Weekly aggregate mention rates; keys are `you` plus competitor ids. */
  trend: Array<Record<string, string | number>>;
  runsAnalyzed: number;
  runsSkipped: number;
  note: string;
};

type AnalyzableRun = {
  runAt: Date;
  model: CitationModel;
  rawResponse: string;
  brandMentioned: boolean;
  error: string | null;
};

/**
 * Build share-of-voice comparison by re-running fuzzy detection on existing
 * CitationRun.rawResponse for each competitor. Never invents mentions.
 * Failed runs (error set) are excluded from denominators.
 */
export async function buildCompetitorComparison(
  userId: string
): Promise<CompetitorComparisonData> {
  const [competitors, trackedQueries] = await Promise.all([
    prisma.competitorBrand.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.trackedQuery.findMany({
      where: { userId },
      include: {
        runs: {
          orderBy: { runAt: "desc" },
          take: 400,
        },
      },
    }),
  ]);

  const yourBrand = trackedQueries[0]?.brandName ?? null;
  const competitorRows: CompetitorBrandRow[] = competitors.map((c) => ({
    id: c.id,
    brandName: c.brandName,
    createdAt: c.createdAt.toISOString(),
  }));

  if (competitors.length === 0) {
    return {
      yourBrand,
      competitors: [],
      overall: [],
      byModel: [],
      trend: [],
      runsAnalyzed: 0,
      runsSkipped: 0,
      note: "Add a competitor brand to compare share of voice against your existing citation runs.",
    };
  }

  const allRuns: AnalyzableRun[] = trackedQueries.flatMap((q) => q.runs);
  const skipped = allRuns.filter((r) => r.error).length;
  const successful = allRuns.filter((r) => !r.error);

  const brandKeys = [
    { key: "you", label: yourBrand ?? "Your brand", isYou: true as const },
    ...competitors.map((c) => ({
      key: c.id,
      label: c.brandName,
      isYou: false as const,
    })),
  ];

  const overallStats = Object.fromEntries(
    brandKeys.map((b) => [b.key, { mentioned: 0, total: 0 }])
  ) as Record<string, { mentioned: number; total: number }>;

  const modelStats = Object.fromEntries(
    CITATION_MODELS.map((model) => [
      model,
      Object.fromEntries(
        brandKeys.map((b) => [b.key, { mentioned: 0, total: 0 }])
      ) as Record<string, { mentioned: number; total: number }>,
    ])
  ) as Record<
    CitationModel,
    Record<string, { mentioned: number; total: number }>
  >;

  const weekBuckets = new Map<
    string,
    Record<string, { mentioned: number; total: number }>
  >();

  for (const run of successful) {
    // Your brand: trust the stored detection from Phase 2 (already run at capture time).
    const youMentioned = run.brandMentioned;

    // Competitors: re-detect against the captured rawResponse only — never fabricate.
    const competitorMentions = competitors.map((c) => ({
      key: c.id,
      mentioned: detectBrandMention(run.rawResponse, c.brandName),
    }));

    overallStats.you.total += 1;
    if (youMentioned) overallStats.you.mentioned += 1;

    for (const cm of competitorMentions) {
      overallStats[cm.key].total += 1;
      if (cm.mentioned) overallStats[cm.key].mentioned += 1;
    }

    const mStats = modelStats[run.model];
    mStats.you.total += 1;
    if (youMentioned) mStats.you.mentioned += 1;
    for (const cm of competitorMentions) {
      mStats[cm.key].total += 1;
      if (cm.mentioned) mStats[cm.key].mentioned += 1;
    }

    const week = isoWeekStart(run.runAt);
    if (!weekBuckets.has(week)) {
      weekBuckets.set(
        week,
        Object.fromEntries(
          brandKeys.map((b) => [b.key, { mentioned: 0, total: 0 }])
        )
      );
    }
    const bucket = weekBuckets.get(week)!;
    bucket.you.total += 1;
    if (youMentioned) bucket.you.mentioned += 1;
    for (const cm of competitorMentions) {
      bucket[cm.key].total += 1;
      if (cm.mentioned) bucket[cm.key].mentioned += 1;
    }
  }

  const overall = brandKeys.map((b) =>
    toShareRow(b.key, b.label, b.isYou, overallStats[b.key])
  );

  const byModel = CITATION_MODELS.map((model) => ({
    model,
    label: CITATION_MODEL_LABELS[model],
    brands: brandKeys.map((b) =>
      toShareRow(b.key, b.label, b.isYou, modelStats[model][b.key])
    ),
  }));

  const trend = [...weekBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, stats]) => {
      const point: Record<string, string | number> = { date };
      for (const b of brandKeys) {
        point[b.key] = rate(stats[b.key]);
      }
      return point;
    });

  const note =
    successful.length === 0
      ? "No successful citation runs yet. Competitor comparison uses existing raw responses — wait for a sweep, then refresh."
      : `Compared ${successful.length} successful run(s)${
          skipped > 0 ? ` (${skipped} failed run(s) excluded)` : ""
        }. Competitor mentions re-detected from stored responses — never invented.`;

  return {
    yourBrand,
    competitors: competitorRows,
    overall,
    byModel,
    trend,
    runsAnalyzed: successful.length,
    runsSkipped: skipped,
    note,
  };
}

function toShareRow(
  key: string,
  label: string,
  isYou: boolean,
  stats: { mentioned: number; total: number }
): ShareOfVoiceRow {
  return {
    key,
    label,
    isYou,
    mentionRate: rate(stats),
    mentioned: stats.mentioned,
    total: stats.total,
  };
}

function rate(stats: { mentioned: number; total: number }): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.mentioned / stats.total) * 100);
}

function isoWeekStart(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}
