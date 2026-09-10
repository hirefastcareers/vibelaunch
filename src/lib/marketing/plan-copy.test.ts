import { describe, expect, it } from "vitest";
import { PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/billing/plans";
import {
  formatSuggestionsPerMonth,
  marketingPlanRows,
} from "@/lib/marketing/plan-copy";

describe("marketing plan copy", () => {
  it("mirrors PLAN_LIMITS and PLAN_DISPLAY without hardcoded drift", () => {
    const rows = marketingPlanRows();
    expect(rows).toHaveLength(3);

    for (const row of rows) {
      const limits = PLAN_LIMITS[row.tier];
      const display = PLAN_DISPLAY[row.tier];
      expect(row.label).toBe(display.label);
      expect(row.price).toBe(display.price);
      expect(row.trackedQueries).toBe(limits.trackedQueries);
      expect(row.competitors).toBe(limits.competitors);
      expect(row.modelCount).toBe(limits.citationModels.length);
      expect(row.suggestions).toBe(formatSuggestionsPerMonth(row.tier));
    }
  });

  it("marks Pro suggestions as fair use when soft-capped", () => {
    expect(formatSuggestionsPerMonth("PRO")).toContain("fair use");
    expect(formatSuggestionsPerMonth("FREE")).not.toContain("fair use");
  });
});
