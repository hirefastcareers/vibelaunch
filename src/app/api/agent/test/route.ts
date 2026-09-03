import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { runFullDiagnosticSuite } from "@/lib/agents/tester";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { projectId?: string };
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

    const diagnosticReport = await runFullDiagnosticSuite(project.id);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...diagnosticReport,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
