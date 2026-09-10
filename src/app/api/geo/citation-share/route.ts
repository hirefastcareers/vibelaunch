import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { buildCitationShareDemo } from "@/lib/geo/citation-share-demo";

export const dynamic = "force-dynamic";

/**
 * Phase 1 stub: returns mocked citation-share only when isDemoMode() is true.
 * Live mode returns an honest empty payload (no fabricated provider metrics).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    brandName?: string;
    trackedQueries?: string[] | string;
  };

  const brandName = (body.brandName ?? "").trim();
  const trackedQueries = normalizeQueries(body.trackedQueries);

  if (!brandName) {
    return NextResponse.json({ error: "brandName is required" }, { status: 400 });
  }

  if (!isDemoMode()) {
    return NextResponse.json({
      demo: false,
      brandName,
      trackedQueries,
      rows: [],
      trend: [],
      note: "Live AI citation-share tracking is not wired yet. Enable DEMO_MODE to preview the stub UI with labeled mock data.",
    });
  }

  await demoDelay(400);
  return NextResponse.json(buildCitationShareDemo(brandName, trackedQueries));
}

function normalizeQueries(raw: string[] | string | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.map((q) => q.trim()).filter(Boolean).slice(0, 12);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[\n,]/)
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  return [];
}
