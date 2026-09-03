import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validators";
import { assertCanCreateProject, UsageLimitError } from "@/lib/billing/limits";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { posts: true, changelog: true } } },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await assertCanCreateProject(session.user.id);
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 403 },
      );
    }
    throw err;
  }

  const existing = await prisma.project.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      websiteUrl: parsed.data.websiteUrl || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
