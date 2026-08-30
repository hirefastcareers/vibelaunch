import { describe, it, expect } from "vitest";
import {
  computeSuiteScore,
  deriveSuiteStatus,
  deriveOverallStatus,
} from "@/lib/diagnostics/scoring";
import type { DiagnosticAssertion } from "@/lib/diagnostics/types";

describe("diagnostic scoring", () => {
  it("computes score from passed assertions", () => {
    const assertions: DiagnosticAssertion[] = [
      { name: "a", passed: true, severity: "error", message: "ok" },
      { name: "b", passed: true, severity: "error", message: "ok" },
      { name: "c", passed: false, severity: "warning", message: "warn" },
    ];
    expect(computeSuiteScore(assertions)).toBe(83.3);
  });

  it("derives passed status for high scores without critical failures", () => {
    const assertions: DiagnosticAssertion[] = [
      { name: "a", passed: true, severity: "error", message: "ok" },
      { name: "b", passed: true, severity: "error", message: "ok" },
    ];
    expect(deriveSuiteStatus(100, assertions)).toBe("passed");
  });

  it("derives warning for moderate scores", () => {
    expect(deriveSuiteStatus(65, [])).toBe("warning");
  });

  it("derives overall status from suite statuses", () => {
    expect(deriveOverallStatus(90, ["passed", "warning"])).toBe("passed");
    expect(deriveOverallStatus(90, ["passed", "failed"])).toBe("failed");
  });
});
