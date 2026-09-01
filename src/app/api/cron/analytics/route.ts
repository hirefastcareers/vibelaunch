import { NextRequest, NextResponse } from "next/server";
import { runEriAnalyticsCron } from "@/lib/analytics/cron";
import { reinforceHighPerformingEmbeddings } from "@/lib/vector/embeddings";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_CRON_ANALYTICS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isDemoMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    await demoDelay();
    return NextResponse.json({
      ...MOCK_CRON_ANALYTICS,
      ranAt: new Date().toISOString(),
      message: "Demo: analytics cron completed successfully (simulated)",
    });
  }

  const eriResult = await runEriAnalyticsCron();
  const reinforced = await reinforceHighPerformingEmbeddings();

  return NextResponse.json({
    eri: eriResult,
    reinforced,
    ranAt: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/cron/analytics",
    description: "Analytics cron - ERI snapshots and vector reinforcement",
    method: "POST",
  });
}
