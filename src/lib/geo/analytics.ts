import type { LLMProvider } from "./llm-schema";

export interface GeoMetricRecord {
  id: string;
  queryPrompt: string;
  cited: boolean;
  citationUrl: string | null;
  llmProvider: string;
  checkedAt: Date | string;
}

export interface GeoDashboardData {
  citationScore: number;
  byProvider: Record<
    LLMProvider,
    { cited: number; total: number; label: string }
  >;
  recentMetrics: GeoMetricRecord[];
  suggestions: string[];
}

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  perplexity: "Perplexity",
  chatgpt: "ChatGPT",
  claude: "Claude",
};

export function computeCitationScore(metrics: GeoMetricRecord[]): number {
  if (metrics.length === 0) return 0;
  const cited = metrics.filter((m) => m.cited).length;
  return Math.round((cited / metrics.length) * 1000) / 10;
}

export function groupByProvider(
  metrics: GeoMetricRecord[]
): GeoDashboardData["byProvider"] {
  const providers: LLMProvider[] = ["perplexity", "chatgpt", "claude"];
  const result = {} as GeoDashboardData["byProvider"];

  for (const provider of providers) {
    const providerMetrics = metrics.filter((m) => m.llmProvider === provider);
    result[provider] = {
      cited: providerMetrics.filter((m) => m.cited).length,
      total: providerMetrics.length,
      label: PROVIDER_LABELS[provider],
    };
  }

  return result;
}

export function generateGeoSuggestions(
  metrics: GeoMetricRecord[],
  projectName: string
): string[] {
  const suggestions: string[] = [];
  const score = computeCitationScore(metrics);
  const byProvider = groupByProvider(metrics);

  if (score < 30) {
    suggestions.push(
      `Publish a comparison page: "How ${projectName} compares to alternatives" - AI search tools often recommend products that spell this out.`
    );
  }

  if (byProvider.claude.cited === 0 && byProvider.claude.total > 0) {
    suggestions.push(
      "Add a simple FAQ on your public pages - Claude is more likely to mention products that answer common questions directly."
    );
  }

  if (byProvider.perplexity.cited < byProvider.perplexity.total) {
    suggestions.push(
      "Include pricing, features, and who the product is for on public pages - Perplexity cites pages that spell this out clearly."
    );
  }

  if (byProvider.chatgpt.cited < byProvider.chatgpt.total) {
    suggestions.push(
      "Publish benchmark data or usage stats - ChatGPT citations increase when pages contain specific, verifiable numbers."
    );
  }

  const uncitedPrompts = metrics.filter((m) => !m.cited).map((m) => m.queryPrompt);
  if (uncitedPrompts.length > 0) {
    suggestions.push(
      `Create content targeting: "${uncitedPrompts[0]}" - you're not yet cited for this high-intent query.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Strong presence in AI search - keep publishing articles and refresh them with each release."
    );
  }

  return suggestions.slice(0, 4);
}

export function buildGeoDashboardData(
  metrics: GeoMetricRecord[],
  projectName: string
): GeoDashboardData {
  const recent = metrics.slice(0, 12);
  return {
    citationScore: computeCitationScore(metrics),
    byProvider: groupByProvider(metrics),
    recentMetrics: recent,
    suggestions: generateGeoSuggestions(metrics, projectName),
  };
}

export interface CitationTrendPoint {
  date: string;
  [provider: string]: number | string;
}

type WeekCounts = Record<string, { cited: number; total: number }>;

/** Monday (UTC) of the ISO week that contains `input`. */
function isoWeekStart(input: Date): string {
  const d = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const day = d.getUTCDay();
  const isoDay = day === 0 ? 7 : day;
  d.setUTCDate(d.getUTCDate() - (isoDay - 1));
  return d.toISOString().split("T")[0];
}

export function buildCitationTrend(metrics: GeoMetricRecord[]): CitationTrendPoint[] {
  const weeks = new Map<string, WeekCounts>();

  for (const metric of metrics) {
    const checked = new Date(metric.checkedAt);
    if (Number.isNaN(checked.getTime())) continue;

    const week = isoWeekStart(checked);
    const counts = weeks.get(week) ?? {};
    const provider = metric.llmProvider;
    const current = counts[provider] ?? { cited: 0, total: 0 };
    current.total += 1;
    if (metric.cited) current.cited += 1;
    counts[provider] = current;
    weeks.set(week, counts);
  }

  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      const point: CitationTrendPoint = { date };
      for (const [provider, { cited, total }] of Object.entries(counts)) {
        if (total === 0) continue;
        point[provider] = Math.round((cited / total) * 1000) / 10;
      }
      return point;
    });
}
