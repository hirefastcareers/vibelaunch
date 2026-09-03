import { NextRequest, NextResponse } from "next/server";
import { runEriAnalyticsCron } from "@/lib/analytics/cron";
import { reinforceHighPerformingEmbeddings } from "@/lib/vector/embeddings";

export const dynamic = "force-dynamic";

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eriResult = await runEriAnalyticsCron();
  const reinforced = await reinforceHighPerformingEmbeddings();

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
