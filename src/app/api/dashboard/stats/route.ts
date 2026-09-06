import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDashboardStats } from "@/lib/dashboard/get-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getDashboardStats(session.user.id, {
    name: session.user.name ?? null,
    xUsername: session.user.xUsername ?? null,
  });

  return NextResponse.json(data);
}
