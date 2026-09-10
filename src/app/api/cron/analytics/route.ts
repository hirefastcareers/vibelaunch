import { NextRequest, NextResponse } from "next/server";
import { runEriAnalyticsCron } from "@/lib/analytics/cron";
import { reinforceHighPerformingEmbeddings } from "@/lib/vector/embeddings";
import { isFeatureEnabled, logFeatureSkip } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFeatureEnabled("ERI_ANALYTICS")) {
    logFeatureSkip(
      "ERI_ANALYTICS",
      "belongs to X-growth scope, not Xoopa GEO focus; vercel.json schedule also removed"
    );
    return NextResponse.json({
      skipped: true,
      reason: "ERI_ANALYTICS feature flag is off",
      ranAt: new Date().toISOString(),
    });
  }

  const eriResult = await runEriAnalyticsCron();
  const reinforced = isFeatureEnabled("ERI_REINFORCEMENT")
    ? await reinforceHighPerformingEmbeddings()
    : (logFeatureSkip("ERI_REINFORCEMENT", "belongs to X-growth scope, not Xoopa GEO focus"), 0);

  return NextResponse.json({
    eri: eriResult,
    reinforced,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
