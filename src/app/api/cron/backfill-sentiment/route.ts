import { NextRequest, NextResponse } from "next/server";
import { backfillSentimentBatch } from "@/lib/geo/backfill-sentiment";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Automated Phase 5 sentiment backfill.
 * Runs on a schedule after deploy so historical CitationRun rows get classified
 * without a manual Tom step. SQL migrations cannot call OpenAI; this cron is
 * the ship-time backfill path.
 */
async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await backfillSentimentBatch(40);

  return NextResponse.json({
    ...stats,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
