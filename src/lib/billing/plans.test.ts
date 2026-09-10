import { describe, expect, it } from "vitest";
import {
  PLAN_DISPLAY,
  PLAN_LIMITS,
  citationModelsForPlan,
  planRunsOnUtcWeekday,
} from "@/lib/billing/plans";

describe("plan schedule and model gates", () => {
  it("prices Phase 7 tiers in GBP as specified", () => {
    expect(PLAN_DISPLAY.FREE.price).toBe("£0");
    expect(PLAN_DISPLAY.STARTER.price).toBe("£15/mo");
    expect(PLAN_DISPLAY.PRO.price).toBe("£39/mo");
  });

  it("Free excludes Claude and Grok", () => {
    expect(citationModelsForPlan("FREE")).toEqual([
      "openai",
      "perplexity",
      "gemini",
    ]);
    expect(citationModelsForPlan("STARTER")).toHaveLength(5);
    expect(citationModelsForPlan("PRO")).toHaveLength(5);
  });

  it("Free/Starter run Mondays only; Pro runs Mon+Thu", () => {
    expect(planRunsOnUtcWeekday("FREE", 1)).toBe(true); // Mon
    expect(planRunsOnUtcWeekday("FREE", 4)).toBe(false); // Thu
    expect(planRunsOnUtcWeekday("STARTER", 4)).toBe(false);
    expect(planRunsOnUtcWeekday("PRO", 1)).toBe(true);
    expect(planRunsOnUtcWeekday("PRO", 4)).toBe(true);
    expect(planRunsOnUtcWeekday("PRO", 2)).toBe(false); // Tue
  });

  it("keeps workspace project/post caps unchanged from billing Pass 2", () => {
    expect(PLAN_LIMITS.FREE.projects).toBe(1);
    expect(PLAN_LIMITS.STARTER.postsPerMonth).toBe(40);
    expect(PLAN_LIMITS.PRO.projects).toBe(10);
  });
});
