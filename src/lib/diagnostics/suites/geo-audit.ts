import { prisma } from "@/lib/prisma";
import { computeCitationScore } from "@/lib/geo/analytics";
import type { DiagnosticAssertion, SuiteResult } from "../types";
import { computeSuiteScore, deriveSuiteStatus } from "../scoring";

const STALE_DAYS = 7;

export async function runGeoAudit(projectId: string): Promise<SuiteResult> {
  const start = Date.now();
  const assertions: DiagnosticAssertion[] = [];

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    assertions.push({
      name: "project_exists",
      passed: false,
      severity: "error",
      message: "Project not found",
    });
    const score = 0;
    return buildResult(assertions, score, start);
  }

  const metrics = await prisma.geoMetric.findMany({
    where: { projectId },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });

  assertions.push({
    name: "geo_metrics_recorded",
    passed: metrics.length > 0,
    severity: "error",
    message:
      metrics.length > 0
        ? `${metrics.length} GEO citation check(s) on record`
        : "No GEO citation checks run — trigger /api/geo/check",
    meta: { count: metrics.length },
  });

  if (metrics.length > 0) {
    const citationScore = computeCitationScore(metrics);
    assertions.push({
      name: "citation_score",
      passed: citationScore >= 25,
      severity: citationScore >= 50 ? "warning" : "error",
      message: `GEO citation score: ${citationScore}% across niche AI prompts`,
      meta: { citationScore },
    });

    const providers = ["perplexity", "chatgpt", "claude"] as const;
    for (const provider of providers) {
      const providerMetrics = metrics.filter((m) => m.llmProvider === provider);
      const cited = providerMetrics.filter((m) => m.cited).length;
      assertions.push({
        name: `${provider}_citations`,
        passed: cited > 0,
        severity: "warning",
        message:
          cited > 0
            ? `${provider}: cited in ${cited}/${providerMetrics.length} checks`
            : `${provider}: no citations detected yet`,
        meta: { cited, total: providerMetrics.length },
      });
    }

    const latest = metrics[0].checkedAt;
    const staleMs = STALE_DAYS * 86400000;
    const isStale = Date.now() - latest.getTime() > staleMs;
    assertions.push({
      name: "citation_freshness",
      passed: !isStale,
      severity: "warning",
      message: isStale
        ? `Last GEO check was ${STALE_DAYS}+ days ago — recheck recommended`
        : "GEO citation data is fresh",
      meta: { lastChecked: latest.toISOString() },
    });
  } else {
    assertions.push({
      name: "citation_score",
      passed: false,
      severity: "warning",
      message: "Citation score unavailable — no GEO metrics yet",
    });
  }

  const score = computeSuiteScore(assertions);
  return buildResult(assertions, score, start);
}

function buildResult(
  assertions: DiagnosticAssertion[],
  score: number,
  start: number
): SuiteResult {
  const status = deriveSuiteStatus(score, assertions);
  const passed = assertions.filter((a) => a.passed).length;
  return {
    suite: "geo_audit",
    status,
    score,
    details: {
      assertions,
      summary: `${passed}/${assertions.length} checks passed — GEO citations ${status}`,
      durationMs: Date.now() - start,
    },
  };
}
