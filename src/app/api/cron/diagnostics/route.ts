import { NextRequest, NextResponse } from "next/server";
import { runDiagnosticsForAllProjects } from "@/lib/diagnostics/agent";

export const dynamic = "force-dynamic";

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDiagnosticsForAllProjects();

  return NextResponse.json({
    ...result,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
