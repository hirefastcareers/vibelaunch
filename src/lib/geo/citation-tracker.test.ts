import { describe, it, expect } from "vitest";
import { detectCitation } from "@/lib/geo/citation-tracker";

describe("detectCitation", () => {
  it("detects citation by project name", () => {
    const result = detectCitation(
      "Top tools include Xoopa for indie founders.",
      "Xoopa",
      "https://xoopa.app"
    );
    expect(result.cited).toBe(true);
  });

  it("detects citation by domain", () => {
    const result = detectCitation(
      "Check out https://xoopa.app for launch automation.",
      "OtherApp",
      "https://xoopa.app"
    );
    expect(result.cited).toBe(true);
    expect(result.citationUrl).toContain("xoopa.app");
  });

  it("returns not cited when absent", () => {
    const result = detectCitation(
      "Buffer and Hypefury are popular schedulers.",
      "Xoopa",
      "https://xoopa.app"
    );
    expect(result.cited).toBe(false);
    expect(result.citationUrl).toBeNull();
  });
});
