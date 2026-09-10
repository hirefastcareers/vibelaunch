import type { CitationModel, CitationSentiment } from "@prisma/client";
import { formatFirstResultsMessage } from "@/lib/geo/next-citation-sweep";
import { prisma } from "@/lib/prisma";

export const CITATION_MODEL_LABELS: Record<CitationModel, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
};

export const CITATION_MODELS: CitationModel[] = [
  "openai",
  "anthropic",
  "gemini",
  "perplexity",
  "grok",
];

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
  grok: number;
};

export type SentimentCounts = {
  positive: number;
  neutral: number;
  negative: number;
  /** Mentions that still lack a classifier label (honest nulls). */
  unclassified: number;
};

export type CitationDashboardData = {
  demo: false;
  brandName: string | null;
  trackedQueries: Array<{
    id: string;
    brandName: string;
    promptText: string;
    active: boolean;
  }>;
  rows: CitationDashboardRow[];
  trend: CitationDashboardTrendPoint[];
  mentionTrend: Array<{ date: string; mentionRate: number }>;
  recentUrls: string[];
  /** Brand-mention sentiment totals (only brandMentioned=true runs). */
  sentiment: SentimentCounts;
  /** Per-model brand-mention sentiment split. */
  sentimentByModel: Array<{
    model: CitationModel;
    label: string;
    counts: SentimentCounts;
  }>;
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
  const mentionedRuns = successful.filter((run) => run.brandMentioned);

  const rows: CitationDashboardRow[] = CITATION_MODELS.map((model) => {
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
    const values = [
      point.openai,
      point.anthropic,
      point.gemini,
      point.perplexity,
      point.grok,
    ];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { date: point.date, mentionRate: Math.round(avg) };
  });

  const recentUrls = [
    ...new Set(successful.flatMap((run) => run.citedUrls)),
  ].slice(0, 20);

  const sentiment = countSentiments(mentionedRuns.map((r) => r.sentiment));
  const sentimentByModel = CITATION_MODELS.map((model) => ({
    model,
    label: CITATION_MODEL_LABELS[model],
    counts: countSentiments(
      mentionedRuns.filter((r) => r.model === model).map((r) => r.sentiment)
    ),
  }));

  const classified =
    sentiment.positive + sentiment.neutral + sentiment.negative;

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
    sentiment,
    sentimentByModel,
    note:
      successful.length === 0
        ? `${formatFirstResultsMessage()} Sweeps run Mon & Thu at 06:00 UTC.`
        : mentionedRuns.length === 0
          ? `Live results from ${successful.length} successful model run(s). No brand mentions yet — sentiment stays empty until a mention is classified.`
          : classified === 0
            ? `Live results from ${successful.length} successful model run(s). ${mentionedRuns.length} mention(s) awaiting sentiment classification (null until the classifier succeeds).`
            : `Live results from ${successful.length} successful model run(s). Sentiment on ${classified}/${mentionedRuns.length} brand mention(s); unclassified stays null.`,
  };
}

function countSentiments(
  values: Array<CitationSentiment | null | undefined>
): SentimentCounts {
  const counts: SentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
    unclassified: 0,
  };
  for (const value of values) {
    if (value === "positive") counts.positive += 1;
    else if (value === "neutral") counts.neutral += 1;
    else if (value === "negative") counts.negative += 1;
    else counts.unclassified += 1;
  }
  return counts;
}


function emptyBucket(): Record<CitationModel, { mentioned: number; total: number }> {
  return {
    openai: { mentioned: 0, total: 0 },
    anthropic: { mentioned: 0, total: 0 },
    gemini: { mentioned: 0, total: 0 },
    perplexity: { mentioned: 0, total: 0 },
    grok: { mentioned: 0, total: 0 },
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
      buckets.set(date, emptyBucket());
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
      grok: rate(models.grok),
    }));
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
