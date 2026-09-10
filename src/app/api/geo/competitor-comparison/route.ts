import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildCompetitorComparison } from "@/lib/geo/competitor-comparison";

export const dynamic = "force-dynamic";

/**
 * GET share-of-voice comparison for the signed-in user.
 * Uses stored CitationRun.rawResponse + live competitor list — no extra model calls.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comparison = await buildCompetitorComparison(session.user.id);
  return NextResponse.json(comparison);
}
