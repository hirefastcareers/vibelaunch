import { describe, it, expect } from "vitest";
import { runFullDiagnosticSuite } from "@/lib/agents/tester";

describe("tester agent", () => {
  it("exports runFullDiagnosticSuite from agents/tester", async () => {
    const report = await runFullDiagnosticSuite("demo-project");
    expect(report.results).toHaveLength(4);
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallStatus).toBeDefined();
  });
});
