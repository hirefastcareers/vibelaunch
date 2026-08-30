import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { DiagnosticRunSummary, DiagnosticSuite, SuiteResult } from "./types";
import { ALL_SUITES } from "./types";
import { deriveOverallStatus } from "./scoring";
import { runSeoAudit } from "./suites/seo-audit";
import { runFeedbackLoopAudit } from "./suites/feedback-loop";
import { runMediaRenderAudit } from "./suites/media-render";
import { runGeoAudit } from "./suites/geo-audit";

const SUITE_RUNNERS: Record<
  DiagnosticSuite,
  (projectId: string) => Promise<SuiteResult>
> = {
  seo_audit: runSeoAudit,
  feedback_loop: runFeedbackLoopAudit,
  media_render: runMediaRenderAudit,
  geo_audit: runGeoAudit,
};

export async function runDiagnosticSuite(
  projectId: string,
  suite: DiagnosticSuite
): Promise<SuiteResult> {
  const result = await SUITE_RUNNERS[suite](projectId);

  await prisma.testRun.create({
    data: {
      projectId,
      suite: result.suite,
      status: result.status,
      score: result.score,
      details: result.details as unknown as Prisma.InputJsonValue,
    },
  });

  return result;
}

export async function runAllDiagnostics(
  projectId: string,
  suites: DiagnosticSuite[] = ALL_SUITES
): Promise<DiagnosticRunSummary> {
  const results: SuiteResult[] = [];

  for (const suite of suites) {
    results.push(await runDiagnosticSuite(projectId, suite));
  }

  const overallScore =
    results.length > 0
      ? Math.round(
          (results.reduce((sum, r) => sum + r.score, 0) / results.length) * 10
        ) / 10
      : 0;

  const overallStatus = deriveOverallStatus(
    overallScore,
    results.map((r) => r.status)
  );

  return {
    projectId,
    overallScore,
    overallStatus,
    suites: results,
    executedAt: new Date().toISOString(),
  };
}

export async function runDiagnosticsForAllProjects(): Promise<{
  processed: number;
  results: DiagnosticRunSummary[];
}> {
  const projects = await prisma.project.findMany({
    where: { status: { in: ["ACTIVE", "LAUNCHED"] } },
    select: { id: true },
  });

  const results: DiagnosticRunSummary[] = [];
  for (const project of projects) {
    results.push(await runAllDiagnostics(project.id));
  }

  return { processed: projects.length, results };
}

export async function getRecentTestRuns(
  projectId: string,
  limit = 20
) {
  return prisma.testRun.findMany({
    where: { projectId },
    orderBy: { executedAt: "desc" },
    take: limit,
  });
}
