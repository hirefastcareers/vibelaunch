import type { CitationModel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CITATION_MODEL_LABELS: Record<CitationModel, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

export type CitationDashboardRow = {
  model: CitationModel;
  label: string;
  mentionRate: number;
  mentioned: number;
  total: number;
  recentCitedUrls: string[];
};

export type CitationDashboardTrendPoint = {
  date: string;
  openai: number;
  anthropic: number;
  gemini: number;
  perplexity: number;
};

export type CitationDashboardData = {
  demo: false;
  brandName: string | null;
  trackedQueries: Array<{ id: string; brandName: string; promptText: string; active: boolean }>;
  rows: CitationDashboardRow[];
  trend: CitationDashboardTrendPoint[];
  mentionTrend: Array<{ date: string; mentionRate: number }>;
  recentUrls: string[];
  note: string;
};

/**
 * Aggregate live CitationRun rows for a user. Never invents metrics.
 */
export async function buildCitationDashboard(
  userId: string
): Promise<CitationDashboardData> {
  const trackedQueries = await prisma.trackedQuery.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      runs: {
        orderBy: { runAt: "desc" },
        take: 200,
      },
    },
  });

  const allRuns = trackedQueries.flatMap((q) => q.runs);
  const successful = allRuns.filter((run) => !run.error);

  const models: CitationModel[] = ["openai", "anthropic", "gemini", "perplexity"];
  const rows: CitationDashboardRow[] = models.map((model) => {
    const modelRuns = successful.filter((run) => run.model === model);
    const mentioned = modelRuns.filter((run) => run.brandMentioned).length;
    const total = modelRuns.length;
    const recentCitedUrls = [
      ...new Set(modelRuns.flatMap((run) => run.citedUrls)),
    ].slice(0, 8);

    return {
      model,
      label: CITATION_MODEL_LABELS[model],
      mentionRate: total === 0 ? 0 : Math.round((mentioned / total) * 100),
      mentioned,
      total,
      recentCitedUrls,
    };
  });

  const trend = buildWeeklyTrend(successful);
  const mentionTrend = trend.map((point) => {
    const values = [point.openai, point.anthropic, point.gemini, point.perplexity];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { date: point.date, mentionRate: Math.round(avg) };
  });

  const recentUrls = [...new Set(successful.flatMap((run) => run.citedUrls))].slice(
    0,
    20
  );

  return {
    demo: false,
    brandName: trackedQueries[0]?.brandName ?? null,
    trackedQueries: trackedQueries.map((q) => ({
      id: q.id,
      brandName: q.brandName,
      promptText: q.promptText,
      active: q.active,
    })),
    rows,
    trend,
    mentionTrend,
    recentUrls,
    note:
      successful.length === 0
        ? "No live citation runs yet. Add tracked queries and wait for the 2x/week sweep, or trigger a run."
        : `Live results from ${successful.length} successful model run(s). Sentiment classification is deferred to Phase 3.`,
  };
}

function buildWeeklyTrend(
  runs: Array<{ runAt: Date; model: CitationModel; brandMentioned: boolean }>
): CitationDashboardTrendPoint[] {
  const buckets = new Map<
    string,
    Record<CitationModel, { mentioned: number; total: number }>
  >();

  for (const run of runs) {
    const date = isoWeekStart(run.runAt);
    if (!buckets.has(date)) {
      buckets.set(date, {
        openai: { mentioned: 0, total: 0 },
        anthropic: { mentioned: 0, total: 0 },
        gemini: { mentioned: 0, total: 0 },
        perplexity: { mentioned: 0, total: 0 },
      });
    }
    const bucket = buckets.get(date)!;
    bucket[run.model].total += 1;
    if (run.brandMentioned) bucket[run.model].mentioned += 1;
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, models]) => ({
      date,
      openai: rate(models.openai),
      anthropic: rate(models.anthropic),
      gemini: rate(models.gemini),
      perplexity: rate(models.perplexity),
    }));
}

function rate(stats: { mentioned: number; total: number }): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.mentioned / stats.total) * 100);
}

function isoWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}
