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
      `Publish a comparison page: "How ${projectName} compares to alternatives" — LLMs heavily cite structured comparison content.`
    );
  }

  if (byProvider.claude.cited === 0 && byProvider.claude.total > 0) {
    suggestions.push(
      "Add FAQ schema with direct Q&A pairs — Claude retrieval favors FAQPage JSON-LD on changelog pages."
    );
  }

  if (byProvider.perplexity.cited < byProvider.perplexity.total) {
    suggestions.push(
      "Include pricing, feature list, and target audience on public pages — Perplexity cites pages with explicit SoftwareApplication schema."
    );
  }

  if (byProvider.chatgpt.cited < byProvider.chatgpt.total) {
    suggestions.push(
      "Publish benchmark data or usage stats — ChatGPT citations increase when pages contain specific, verifiable numbers."
    );
  }

  const uncitedPrompts = metrics.filter((m) => !m.cited).map((m) => m.queryPrompt);
  if (uncitedPrompts.length > 0) {
    suggestions.push(
      `Create content targeting: "${uncitedPrompts[0]}" — you're not yet cited for this high-intent query.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Strong GEO presence — maintain changelog cadence and refresh JSON-LD schema with each release."
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
