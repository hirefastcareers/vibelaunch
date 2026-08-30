import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { isDemoMode } from "@/lib/demo-mode";
import type { DiagnosticRunSummary, DiagnosticSuite } from "./types";
import { ALL_SUITES } from "./types";
import {
  runFullDiagnosticSuite,
  runSeoAudit,
  runFeedbackLoopTest,
  runMediaValidation,
  runGeoAudit,
  type TestSuiteResult,
} from "@/lib/agents/tester";

const SUITE_RUNNERS: Record<
  DiagnosticSuite,
  (projectId: string) => Promise<TestSuiteResult>
> = {
  seo_audit: runSeoAudit,
  feedback_loop: runFeedbackLoopTest,
  media_render: runMediaValidation,
  geo_audit: runGeoAudit,
};

export async function runDiagnosticSuite(
  projectId: string,
  suite: DiagnosticSuite
): Promise<TestSuiteResult> {
  const result = await SUITE_RUNNERS[suite](projectId);

  if (!isDemoMode()) {
    await db.testRun.create({
      data: {
        projectId,
        suite: result.suite,
        status: result.status,
        score: result.score,
        details: result.details as Prisma.InputJsonValue,
      },
    });
  }

  return result;
}

export async function runAllDiagnostics(
  projectId: string
): Promise<DiagnosticRunSummary> {
  const { overallScore, overallStatus, results } =
    await runFullDiagnosticSuite(projectId);

  return {
    projectId,
    overallScore,
    overallStatus: overallStatus as DiagnosticRunSummary["overallStatus"],
    suites: results,
    executedAt: new Date().toISOString(),
  };
}

export async function runDiagnosticsForAllProjects(): Promise<{
  processed: number;
  results: DiagnosticRunSummary[];
}> {
  const projects = await db.project.findMany({
    where: { status: { in: ["ACTIVE", "LAUNCHED"] } },
    select: { id: true },
  });

  const summaries: DiagnosticRunSummary[] = [];
  for (const project of projects) {
    summaries.push(await runAllDiagnostics(project.id));
  }

  return { processed: projects.length, results: summaries };
}

export async function getRecentTestRuns(projectId: string, limit = 20) {
  return db.testRun.findMany({
    where: { projectId },
    orderBy: { executedAt: "desc" },
    take: limit,
  });
}

export { runFullDiagnosticSuite };
