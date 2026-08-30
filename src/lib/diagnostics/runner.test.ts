import { describe, it, expect } from "vitest";
import { getMockTestResults } from "@/lib/demo-mode";
import { runFullDiagnosticSuite } from "@/lib/diagnostics/runner";

describe("diagnostic runner", () => {
  it("returns mock results per suite in demo mode", () => {
    const seo = getMockTestResults("seo_audit");
    expect(seo.suite).toBe("seo_audit");
    expect(seo.score).toBeGreaterThan(0);
    expect(seo.details.assertions).toBeDefined();
  });

  it("runs full suite in parallel without persisting in demo mode", async () => {
    const result = await runFullDiagnosticSuite("demo-project");
    expect(result.results).toHaveLength(4);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(["passed", "warning", "failed"]).toContain(result.overallStatus);
  });
});
