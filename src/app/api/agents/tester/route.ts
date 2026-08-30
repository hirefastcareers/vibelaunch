import { NextResponse } from "next/server";
import { runFullDiagnosticSuite } from "@/lib/agents/tester";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId = "demo-project" } = body;

    const diagnosticReport = await runFullDiagnosticSuite(projectId);

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
