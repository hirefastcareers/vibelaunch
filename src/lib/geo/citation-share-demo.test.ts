import { describe, expect, it } from "vitest";
import { isDemoMode } from "@/lib/demo-mode";
import { buildCitationShareDemo } from "@/lib/geo/citation-share-demo";
import { FEATURES } from "@/lib/feature-flags";

describe("isDemoMode", () => {
  it("is off unless DEMO_MODE or NEXT_PUBLIC_DEMO_MODE is true", () => {
    delete process.env.DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    expect(isDemoMode()).toBe(false);

    process.env.DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
    delete process.env.DEMO_MODE;
  });
});

describe("citation-share demo stub", () => {
  it("returns labeled mock rows for a brand and queries", () => {
    const result = buildCitationShareDemo("Acme", ["best CRM", "indie tools"]);
    expect(result.demo).toBe(true);
    expect(result.rows).toHaveLength(4);
    expect(result.rows.map((r) => r.provider)).toEqual([
      "chatgpt",
      "perplexity",
      "claude",
      "gemini",
    ]);
    expect(result.note.toLowerCase()).toContain("demo");
  });
});

describe("GEO pivot feature flags", () => {
  it("keeps ERI growth features off by default", () => {
    expect(FEATURES.ERI_ANALYTICS).toBe(false);
    expect(FEATURES.ERI_REINFORCEMENT).toBe(false);
    expect(FEATURES.ERI_INSPIRED_GENERATION).toBe(false);
  });
});
