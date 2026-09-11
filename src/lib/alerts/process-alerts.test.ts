import { describe, expect, it } from "vitest";
import { changeStillHolds } from "./process-alerts";
import type { RunSnapshot } from "./detect-changes";

function snap(partial: Partial<RunSnapshot> & Pick<RunSnapshot, "id">): RunSnapshot {
  return {
    model: "openai",
    brandMentioned: false,
    sentiment: null,
    competitorMentions: [],
    ...partial,
  };
}

describe("changeStillHolds", () => {
  it("requires citation lost to remain unmentioned", () => {
    expect(
      changeStillHolds(
        { type: "CITATION_LOST", detail: {} },
        snap({ id: "1", brandMentioned: false })
      )
    ).toBe(true);
    expect(
      changeStillHolds(
        { type: "CITATION_LOST", detail: {} },
        snap({ id: "1", brandMentioned: true })
      )
    ).toBe(false);
  });

  it("requires competitor overtake to keep brand out and competitor in", () => {
    const detail = { competitorBrandId: "c1" };
    expect(
      changeStillHolds(
        { type: "COMPETITOR_OVERTAKE", detail },
        snap({
          id: "1",
          brandMentioned: false,
          competitorMentions: [
            {
              competitorBrandId: "c1",
              competitorBrandName: "Rival",
              mentioned: true,
            },
          ],
        })
      )
    ).toBe(true);
  });
});
