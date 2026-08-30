import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { isDemoMode, demoDelay, getMockTestResults } from "@/lib/demo-mode";
import { MOCK_PROJECT } from "@/lib/mock-data";
import { getRecentTestRuns } from "@/lib/diagnostics/agent";
import { ALL_SUITES } from "@/lib/diagnostics/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    await demoDelay();
    const runs = ALL_SUITES.map((suite) => ({
      id: `diag-${suite}`,
      ...getMockTestResults(suite),
      executedAt: new Date().toISOString(),
    }));
    const overallScore =
      Math.round((runs.reduce((s, r) => s + r.score, 0) / runs.length) * 10) / 10;
    return NextResponse.json({
      projectId: MOCK_PROJECT.id,
      projectName: MOCK_PROJECT.name,
      overallScore,
      overallStatus: overallScore >= 80 ? "passed" : overallScore >= 50 ? "warning" : "failed",
      runs,
      history: runs,
    });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  const userId = session.user.id;

  const project = projectId
    ? await db.project.findFirst({ where: { id: projectId, userId } })
    : await db.project.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 404 });
  }

  const runs = await getRecentTestRuns(project.id);

  const latestBySuite = new Map<string, (typeof runs)[0]>();
  for (const run of runs) {
    if (!latestBySuite.has(run.suite)) {
      latestBySuite.set(run.suite, run);
    }
  }

  const suiteResults = Array.from(latestBySuite.values());
  const overallScore =
    suiteResults.length > 0
      ? Math.round(
          (suiteResults.reduce((s, r) => s + r.score, 0) / suiteResults.length) * 10
        ) / 10
      : 0;

  const overallStatus = suiteResults.some((r) => r.status === "failed")
    ? "failed"
    : overallScore >= 80
      ? "passed"
      : overallScore >= 50
        ? "warning"
        : "failed";

  return NextResponse.json({
    projectId: project.id,
    projectName: project.name,
    overallScore,
    overallStatus,
    runs: suiteResults,
    history: runs,
  });
}
