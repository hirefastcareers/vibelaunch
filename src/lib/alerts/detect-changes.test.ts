import { describe, expect, it } from "vitest";
import { detectRunChanges, type RunSnapshot } from "./detect-changes";

function snap(
  partial: Partial<RunSnapshot> & Pick<RunSnapshot, "id" | "brandMentioned">
): RunSnapshot {
  return {
    model: "openai",
    sentiment: null,
    competitorMentions: [],
    ...partial,
  };
}

describe("detectRunChanges", () => {
  const ctx = { brandName: "Xoopa", promptText: "best GEO tools" };

  it("detects citation lost and gained", () => {
    expect(
      detectRunChanges(
        snap({ id: "a", brandMentioned: true }),
        snap({ id: "b", brandMentioned: false }),
        ctx
      ).map((c) => c.type)
    ).toEqual(["CITATION_LOST"]);

    expect(
      detectRunChanges(
        snap({ id: "a", brandMentioned: false }),
        snap({ id: "b", brandMentioned: true }),
        ctx
      ).map((c) => c.type)
    ).toEqual(["CITATION_GAINED"]);
  });

  it("detects positive→negative sentiment flip only", () => {
    expect(
      detectRunChanges(
        snap({ id: "a", brandMentioned: true, sentiment: "positive" }),
        snap({ id: "b", brandMentioned: true, sentiment: "negative" }),
        ctx
      ).map((c) => c.type)
    ).toEqual(["SENTIMENT_FLIP"]);

    expect(
      detectRunChanges(
        snap({ id: "a", brandMentioned: true, sentiment: "positive" }),
        snap({ id: "b", brandMentioned: true, sentiment: "neutral" }),
        ctx
      )
    ).toEqual([]);
  });

  it("detects competitor overtake when brand drops and competitor appears", () => {
    const changes = detectRunChanges(
      snap({
        id: "a",
        brandMentioned: true,
        competitorMentions: [
          {
            competitorBrandId: "c1",
            competitorBrandName: "Rival",
            mentioned: false,
          },
        ],
      }),
      snap({
        id: "b",
        brandMentioned: false,
        competitorMentions: [
          {
            competitorBrandId: "c1",
            competitorBrandName: "Rival",
            mentioned: true,
          },
        ],
      }),
      ctx
    );
    expect(changes.map((c) => c.type)).toContain("COMPETITOR_OVERTAKE");
  });
});
