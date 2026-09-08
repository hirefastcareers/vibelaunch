import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { shipUpdateSchema } from "@/lib/ship/schema";
import { ShipError, shipUpdate } from "@/lib/ship/ship-update";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = shipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await shipUpdate(session.user.id, parsed.data);
    const criticalFailed =
      result.steps.generate.status === "failed" &&
      result.steps.article.status === "failed";

    return NextResponse.json(result, { status: criticalFailed ? 502 : 200 });
  } catch (error) {
    if (error instanceof ShipError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("[ship]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ship failed" },
      { status: 500 }
    );
  }
}
