import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getRecentTestRuns } from "@/lib/diagnostics/agent";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
