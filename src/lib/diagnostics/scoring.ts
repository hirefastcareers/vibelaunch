import type { DiagnosticAssertion, DiagnosticStatus } from "./types";

export function computeSuiteScore(assertions: DiagnosticAssertion[]): number {
  if (assertions.length === 0) return 0;

  const points = assertions.reduce((sum, a) => {
    if (a.passed) return sum + 1;
    if (a.severity === "warning") return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((points / assertions.length) * 1000) / 10;
}

export function deriveSuiteStatus(
  score: number,
  assertions: DiagnosticAssertion[]
): DiagnosticStatus {
  const criticalFailures = assertions.filter(
    (a) => !a.passed && a.severity === "error"
  ).length;

  if (criticalFailures > 0 && score < 50) return "failed";
  if (score >= 80 && criticalFailures === 0) return "passed";
  if (score >= 50) return "warning";
  return "failed";
}

export function deriveOverallStatus(
  score: number,
  suiteStatuses: DiagnosticStatus[]
): DiagnosticStatus {
  if (suiteStatuses.some((s) => s === "failed")) return "failed";
  if (score >= 80) return "passed";
  if (score >= 50) return "warning";
  return "failed";
}
