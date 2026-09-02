import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_DIAGNOSTICS_CRON } from "@/lib/mock-data";
import { runDiagnosticsForAllProjects } from "@/lib/diagnostics/agent";

export const dynamic = "force-dynamic";

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isDemoMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    await demoDelay(2000);
    return NextResponse.json({
      ...MOCK_DIAGNOSTICS_CRON,
      ranAt: new Date().toISOString(),
      message: "Demo: diagnostic agent completed successfully (simulated)",
    });
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
