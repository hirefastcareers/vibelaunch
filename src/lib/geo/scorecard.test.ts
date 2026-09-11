import { describe, expect, it } from "vitest";
import {
  computeVisibilityScore,
  scorecardDataIsSufficient,
  SCORECARD_MIN_MODELS_WITH_DATA,
  SCORECARD_MIN_SUCCESSFUL_RUNS,
} from "@/lib/geo/scorecard";

describe("computeVisibilityScore", () => {
  it("returns null when no models have data", () => {
    expect(
      computeVisibilityScore([
        { mentionRate: null, total: 0 },
        { mentionRate: null, total: 0 },
      ])
    ).toBeNull();
  });

  it("averages only models with successful runs (equal weight)", () => {
    // ChatGPT 50%, Claude 100%, Gemini no data → (50+100)/2 = 75
    expect(
      computeVisibilityScore([
        { mentionRate: 50, total: 10 },
        { mentionRate: 100, total: 2 },
        { mentionRate: null, total: 0 },
      ])
    ).toBe(75);
  });

  it("does not invent a score from zeros without runs", () => {
    expect(computeVisibilityScore([{ mentionRate: 0, total: 0 }])).toBeNull();
  });
});

describe("scorecardDataIsSufficient", () => {
  it("rejects sparse data", () => {
    const result = scorecardDataIsSufficient({
      successfulRuns: SCORECARD_MIN_SUCCESSFUL_RUNS - 1,
      modelsWithData: SCORECARD_MIN_MODELS_WITH_DATA,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/successful citation runs/i);
  });

  it("accepts the documented floor", () => {
    expect(
      scorecardDataIsSufficient({
        successfulRuns: SCORECARD_MIN_SUCCESSFUL_RUNS,
        modelsWithData: SCORECARD_MIN_MODELS_WITH_DATA,
      }).ok
    ).toBe(true);
  });
});
