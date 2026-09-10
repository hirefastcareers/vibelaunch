import { describe, expect, it } from "vitest";
import {
  formatFirstResultsMessage,
  getNextCitationSweep,
} from "./next-citation-sweep";

describe("next-citation-sweep", () => {
  it("points at the next Mon/Thu 06:00 UTC from a Tuesday", () => {
    // 2026-09-08 was a Tuesday
    const now = new Date(Date.UTC(2026, 8, 8, 12, 0, 0));
    const next = getNextCitationSweep(now);
    expect(next.at.toISOString()).toBe("2026-09-10T06:00:00.000Z");
    expect(next.daysUntil).toBe(2);
    expect(formatFirstResultsMessage(now)).toContain("2 days");
  });

  it("uses Thursday when before Thursday's sweep on Thursday morning", () => {
    const now = new Date(Date.UTC(2026, 8, 10, 3, 0, 0)); // Thu 03:00 UTC
    const next = getNextCitationSweep(now);
    expect(next.at.toISOString()).toBe("2026-09-10T06:00:00.000Z");
    expect(next.daysUntil).toBe(1);
  });

  it("skips to Monday after Thursday's sweep has passed", () => {
    const now = new Date(Date.UTC(2026, 8, 10, 7, 0, 0)); // Thu 07:00 UTC
    const next = getNextCitationSweep(now);
    expect(next.at.toISOString()).toBe("2026-09-14T06:00:00.000Z");
  });
});
