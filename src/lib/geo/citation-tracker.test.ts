import { describe, it, expect } from "vitest";
import { detectCitation } from "@/lib/geo/citation-tracker";

describe("detectCitation", () => {
  it("detects citation by project name", () => {
    const result = detectCitation(
      "Top tools include Sorano for indie founders.",
      "Sorano",
      "https://sorano.app"
    );
    expect(result.cited).toBe(true);
  });

  it("detects citation by domain", () => {
    const result = detectCitation(
      "Check out https://sorano.app for launch automation.",
      "OtherApp",
      "https://sorano.app"
    );
    expect(result.cited).toBe(true);
    expect(result.citationUrl).toContain("sorano.app");
  });

  it("returns not cited when absent", () => {
    const result = detectCitation(
      "Buffer and Hypefury are popular schedulers.",
      "Sorano",
      "https://sorano.app"
    );
    expect(result.cited).toBe(false);
    expect(result.citationUrl).toBeNull();
  });
});
