import { describe, it, expect } from "vitest";
import { detectCitation } from "@/lib/geo/citation-tracker";

describe("detectCitation", () => {
  it("detects citation by project name", () => {
    const result = detectCitation(
      "Top tools include VibeLaunch for indie founders.",
      "VibeLaunch",
      "https://vibelaunch.app"
    );
    expect(result.cited).toBe(true);
  });

  it("detects citation by domain", () => {
    const result = detectCitation(
      "Check out https://vibelaunch.app for launch automation.",
      "OtherApp",
      "https://vibelaunch.app"
    );
    expect(result.cited).toBe(true);
    expect(result.citationUrl).toContain("vibelaunch.app");
  });

  it("returns not cited when absent", () => {
    const result = detectCitation(
      "Buffer and Hypefury are popular schedulers.",
      "VibeLaunch",
      "https://vibelaunch.app"
    );
    expect(result.cited).toBe(false);
    expect(result.citationUrl).toBeNull();
  });
});
