import { NextRequest, NextResponse } from "next/server";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { executeCitationSweepForQuery } from "@/lib/geo/citation-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * QStash worker: run all 4 model providers for one TrackedQuery.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature") ?? "";
  const body = await req.text();

  const isValid = await verifyQStashSignature(signature, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { trackedQueryId: string };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload.trackedQueryId) {
    return NextResponse.json(
      { error: "trackedQueryId is required" },
      { status: 400 }
    );
  }

  const outcomes = await executeCitationSweepForQuery(payload.trackedQueryId);

  return NextResponse.json({
    trackedQueryId: payload.trackedQueryId,
    results: outcomes.map((o) => ({
      model: o.model,
      ok: o.ok,
      runId: o.run.id,
      brandMentioned: o.run.brandMentioned,
      citedUrlCount: o.run.citedUrls.length,
      error: o.run.error,
    })),
    ranAt: new Date().toISOString(),
  });
}
