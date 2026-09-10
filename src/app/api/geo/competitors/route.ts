import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  UsageLimitError,
  assertCanCreateCompetitors,
  getUsage,
} from "@/lib/billing/limits";

export const dynamic = "force-dynamic";

/** List competitor brands for the signed-in user (+ plan usage). */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [competitors, usage] = await Promise.all([
    prisma.competitorBrand.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
    getUsage(session.user.id),
  ]);

  return NextResponse.json({
    competitors,
    usage: {
      planTier: usage.planTier,
      competitorCount: usage.competitorCount,
      competitorLimit: usage.competitorLimit,
    },
  });
}

/** Add a competitor brand (user-scoped). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      brandName: z.string().trim().min(1).max(120),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    await assertCanCreateCompetitors(session.user.id, 1);
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 403 }
      );
    }
    throw err;
  }

  const brandName = parsed.data.brandName;
  const existing = await prisma.competitorBrand.findFirst({
    where: {
      userId: session.user.id,
      brandName: { equals: brandName, mode: "insensitive" },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "That competitor is already tracked", competitor: existing },
      { status: 409 }
    );
  }

  const competitor = await prisma.competitorBrand.create({
    data: {
      userId: session.user.id,
      brandName,
    },
  });

  return NextResponse.json({ competitor }, { status: 201 });
}

/** Rename a competitor brand. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1),
      brandName: z.string().trim().min(1).max(120),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.competitorBrand.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const clash = await prisma.competitorBrand.findFirst({
    where: {
      userId: session.user.id,
      brandName: { equals: parsed.data.brandName, mode: "insensitive" },
      NOT: { id: existing.id },
    },
  });
  if (clash) {
    return NextResponse.json(
      { error: "Another competitor already uses that name" },
      { status: 409 }
    );
  }

  const competitor = await prisma.competitorBrand.update({
    where: { id: existing.id },
    data: { brandName: parsed.data.brandName },
  });

  return NextResponse.json({ competitor });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.competitorBrand.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.competitorBrand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
