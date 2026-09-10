import { NextRequest, NextResponse } from "next/server";
import {
  executeCitationSweepForQuery,
  listActiveTrackedQueryIds,
} from "@/lib/geo/citation-runner";
import {
  enqueueCitationSweep,
  isQStashConfigured,
} from "@/lib/queue/qstash";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 2x/week citation sweep trigger (Vercel Cron Mon+Thu 06:00 UTC).
 * Fans out one QStash job per active TrackedQuery when QStash is configured;
 * otherwise runs inline (dev / missing QStash).
 */
async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queryIds = await listActiveTrackedQueryIds();
  if (queryIds.length === 0) {
    return NextResponse.json({
      enqueued: 0,
      ranInline: 0,
      queryIds: [],
      note: "No active TrackedQuery rows",
      ranAt: new Date().toISOString(),
    });
  }

  if (isQStashConfigured()) {
    const messageIds: string[] = [];
    const errors: string[] = [];
    for (const trackedQueryId of queryIds) {
      try {
        const messageId = await enqueueCitationSweep({ trackedQueryId });
        messageIds.push(messageId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[cron/citation-runs] enqueue failed for ${trackedQueryId}:`,
          message
        );
        errors.push(`${trackedQueryId}: ${message}`);
      }
    }

    return NextResponse.json({
      enqueued: messageIds.length,
      ranInline: 0,
      queryIds,
      messageIds,
      errors,
      ranAt: new Date().toISOString(),
    });
  }

  console.warn(
    "[cron/citation-runs] QSTASH_TOKEN missing — running sweeps inline"
  );
  const inline: Array<{ trackedQueryId: string; ok: number; failed: number }> =
    [];
  for (const trackedQueryId of queryIds) {
    const outcomes = await executeCitationSweepForQuery(trackedQueryId);
    inline.push({
      trackedQueryId,
      ok: outcomes.filter((o) => o.ok).length,
      failed: outcomes.filter((o) => !o.ok).length,
    });
  }

  return NextResponse.json({
    enqueued: 0,
    ranInline: inline.length,
    queryIds,
    inline,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
