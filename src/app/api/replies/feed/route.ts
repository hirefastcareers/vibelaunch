import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildRepliesFeed } from "@/lib/x/replies";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await buildRepliesFeed(session.user.id);
  return NextResponse.json(result);
}
