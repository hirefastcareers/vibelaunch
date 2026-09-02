import { describe, it, expect } from "vitest";
import {
  computeCitationScore,
  groupByProvider,
  generateGeoSuggestions,
  buildCitationTrend,
} from "@/lib/geo/analytics";

const metrics = [
  { id: "1", queryPrompt: "q1", cited: true, citationUrl: null, llmProvider: "perplexity", checkedAt: new Date() },
  { id: "2", queryPrompt: "q2", cited: false, citationUrl: null, llmProvider: "chatgpt", checkedAt: new Date() },
  { id: "3", queryPrompt: "q3", cited: true, citationUrl: null, llmProvider: "claude", checkedAt: new Date() },
  { id: "4", queryPrompt: "q4", cited: false, citationUrl: null, llmProvider: "perplexity", checkedAt: new Date() },
];

describe("geo analytics", () => {
  it("computes citation score percentage", () => {
    expect(computeCitationScore(metrics)).toBe(50);
  });

  it("groups metrics by LLM provider", () => {
    const grouped = groupByProvider(metrics);
    expect(grouped.perplexity).toEqual({ cited: 1, total: 2, label: "Perplexity" });
    expect(grouped.chatgpt.cited).toBe(0);
  });

  it("generates actionable suggestions", () => {
    const lowScoreMetrics = [
      { id: "1", queryPrompt: "Best indie tools", cited: false, citationUrl: null, llmProvider: "perplexity", checkedAt: new Date() },
      { id: "2", queryPrompt: "Best indie tools", cited: false, citationUrl: null, llmProvider: "chatgpt", checkedAt: new Date() },
      { id: "3", queryPrompt: "Best indie tools", cited: false, citationUrl: null, llmProvider: "claude", checkedAt: new Date() },
    ];
    const suggestions = generateGeoSuggestions(lowScoreMetrics, "Sorano");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes("Sorano"))).toBe(true);
  });

  it("maps Sunday into the ISO week that started the prior Monday", () => {
    const points = buildCitationTrend([
      {
        id: "sun",
        queryPrompt: "q",
        cited: true,
        citationUrl: null,
        llmProvider: "claude",
        checkedAt: "2026-08-30T23:00:00.000Z",
      },
      {
        id: "mon",
        queryPrompt: "q",
        cited: true,
        citationUrl: null,
        llmProvider: "claude",
        checkedAt: "2026-08-31T00:00:00.000Z",
      },
    ]);
    expect(points.map((p) => p.date)).toEqual(["2026-08-24", "2026-08-31"]);
  });

  it("buckets citation rates by ISO week and omits providers with no checks", () => {
    const points = buildCitationTrend([
      {
        id: "1",
        queryPrompt: "q",
        cited: true,
        citationUrl: null,
        llmProvider: "perplexity",
        checkedAt: "2026-08-26T12:00:00.000Z",
      },
      {
        id: "2",
        queryPrompt: "q",
        cited: false,
        citationUrl: null,
        llmProvider: "perplexity",
        checkedAt: "2026-08-26T12:00:00.000Z",
      },
      {
        id: "3",
        queryPrompt: "q",
        cited: true,
        citationUrl: null,
        llmProvider: "chatgpt",
        checkedAt: "2026-08-26T12:00:00.000Z",
      },
      {
        id: "4",
        queryPrompt: "q",
        cited: true,
        citationUrl: null,
        llmProvider: "perplexity",
        checkedAt: "2026-09-01T12:00:00.000Z",
      },
    ]);

    expect(points).toEqual([
      { date: "2026-08-24", perplexity: 50, chatgpt: 100 },
      { date: "2026-08-31", perplexity: 100 },
    ]);
    expect(points[0]).not.toHaveProperty("claude");
    expect(points[1]).not.toHaveProperty("chatgpt");
  });

  it("returns an empty trend when there are no metrics", () => {
    expect(buildCitationTrend([])).toEqual([]);
  });
});
