import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listCitationGaps } from "@/lib/geo/citation-gaps";

export const dynamic = "force-dynamic";

/**
 * GET citation gaps for the signed-in user.
 * Honest empty array when no successful runs / no gaps exist.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gaps = await listCitationGaps(session.user.id);
  return NextResponse.json({ gaps });
}
