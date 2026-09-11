import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Mark one or all alerts as read. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1).optional(),
      all: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success || (!parsed.data.id && !parsed.data.all)) {
    return NextResponse.json(
      { error: "Provide id or all=true" },
      { status: 400 }
    );
  }

  const now = new Date();
  if (parsed.data.all) {
    const result = await prisma.alert.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ marked: result.count });
  }

  const existing = await prisma.alert.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.alert.update({
    where: { id: existing.id },
    data: { readAt: now },
  });

  return NextResponse.json({ marked: 1 });
}
