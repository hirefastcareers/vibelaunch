import { describe, it, expect } from "vitest";
import {
  computeCitationScore,
  groupByProvider,
  generateGeoSuggestions,
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
});
