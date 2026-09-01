import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { runAllDiagnostics, runDiagnosticSuite } from "@/lib/diagnostics/agent";
import type { DiagnosticSuite } from "@/lib/diagnostics/types";
import { ALL_SUITES } from "@/lib/diagnostics/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    suite?: DiagnosticSuite;
  };

  if (isDemoMode()) {
    await demoDelay(1500);
    const projectId = body.projectId ?? "demo-project-sorano";
    if (body.suite && ALL_SUITES.includes(body.suite)) {
      const result = await runDiagnosticSuite(projectId, body.suite);
      return NextResponse.json({
        projectId,
        projectName: "Sorano",
        overallScore: result.score,
        overallStatus: result.status,
        suites: [result],
        executedAt: new Date().toISOString(),
      });
    }
    const summary = await runAllDiagnostics(projectId);
    return NextResponse.json({ ...summary, projectName: "Sorano" });
  }

  const userId = session.user.id;
  const project = body.projectId
    ? await db.project.findFirst({ where: { id: body.projectId, userId } })
    : await db.project.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 404 });
  }

  if (body.suite && ALL_SUITES.includes(body.suite)) {
    const result = await runDiagnosticSuite(project.id, body.suite);
    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      overallScore: result.score,
      overallStatus: result.status,
      suites: [result],
      executedAt: new Date().toISOString(),
    });
  }

  const summary = await runAllDiagnostics(project.id);
  return NextResponse.json({
    ...summary,
    projectName: project.name,
  });
}
