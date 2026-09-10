import { describe, expect, it } from "vitest";
import {
  GAP_LOOKBACK_RUNS,
  GAP_MENTION_RATE_THRESHOLD,
} from "@/lib/geo/citation-gaps";

describe("citation gap constants", () => {
  it("uses a fixed lookback and 50% threshold", () => {
    expect(GAP_LOOKBACK_RUNS).toBe(5);
    expect(GAP_MENTION_RATE_THRESHOLD).toBe(50);
  });
});

describe("gap reason logic", () => {
  it("classifies latest miss vs low rate", () => {
    function reason(latestMissed: boolean, rate: number) {
      const lowRate = rate < GAP_MENTION_RATE_THRESHOLD;
      if (!latestMissed && !lowRate) return null;
      if (latestMissed && lowRate) return "both";
      if (latestMissed) return "latest_miss";
      return "low_rate";
    }

    expect(reason(true, 0)).toBe("both");
    expect(reason(true, 80)).toBe("latest_miss");
    expect(reason(false, 20)).toBe("low_rate");
    expect(reason(false, 60)).toBe(null);
  });
});
