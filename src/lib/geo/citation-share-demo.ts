import type { LLMProvider } from "./llm-schema";

/** Providers shown in the demo citation-share stub (5 models including Grok). */
export type CitationShareProvider = LLMProvider | "gemini" | "grok";

export const CITATION_SHARE_PROVIDERS: CitationShareProvider[] = [
  "chatgpt",
  "perplexity",
  "claude",
  "gemini",
  "grok",
];

export const CITATION_SHARE_LABELS: Record<CitationShareProvider, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
  gemini: "Gemini",
  grok: "Grok",
};

export type CitationShareRow = {
  provider: CitationShareProvider;
  label: string;
  /** 0–100 share of voice among cited brands for the tracked set */
  citationShare: number;
  citedQueries: number;
  totalQueries: number;
  trend: "up" | "down" | "flat";
};

export type CitationShareDemoResult = {
  demo: true;
  brandName: string;
  trackedQueries: string[];
  generatedAt: string;
  rows: CitationShareRow[];
  trend: Array<{
    date: string;
    chatgpt: number;
    perplexity: number;
    claude: number;
    gemini: number;
    grok: number;
  }>;
  note: string;
};

/**
 * Deterministic mock citation-share for demo mode only.
 * Not real provider data — do not surface unless isDemoMode() is true.
 */
export function buildCitationShareDemo(
  brandName: string,
  trackedQueries: string[]
): CitationShareDemoResult {
  const seed = hashSeed(`${brandName}|${trackedQueries.join("|")}`);
  const queries =
    trackedQueries.length > 0 ? trackedQueries : ["best tools like this"];
  const total = queries.length;

  const shares = CITATION_SHARE_PROVIDERS.map((provider, i) => {
    const citationShare = 18 + ((seed + i * 17) % 55);
    const citedQueries = Math.min(
      total,
      1 + ((seed + i * 3) % Math.max(total, 1))
    );
    const trendRoll = (seed + i) % 3;
    return {
      provider,
      label: CITATION_SHARE_LABELS[provider],
      citationShare,
      citedQueries,
      totalQueries: total,
      trend: (trendRoll === 0
        ? "up"
        : trendRoll === 1
          ? "down"
          : "flat") as CitationShareRow["trend"],
    };
  });

  const trend = Array.from({ length: 6 }, (_, week) => {
    const base = seed % 20;
    return {
      date: isoWeekAgo(5 - week),
      chatgpt: clamp(base + 20 + week * 3 + (seed % 5)),
      perplexity: clamp(base + 15 + week * 2 + ((seed + 2) % 7)),
      claude: clamp(base + 12 + week * 2 + ((seed + 4) % 6)),
      gemini: clamp(base + 10 + week * 1 + ((seed + 6) % 8)),
      grok: clamp(base + 14 + week * 2 + ((seed + 8) % 5)),
    };
  });

  return {
    demo: true,
    brandName: brandName.trim() || "Your brand",
    trackedQueries: queries,
    generatedAt: new Date().toISOString(),
    rows: shares,
    trend,
    note: "Demo stub — not live citation data. Live pipeline queries ChatGPT, Claude, Gemini, Perplexity, and Grok.",
  };
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function isoWeekAgo(weeksAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}
