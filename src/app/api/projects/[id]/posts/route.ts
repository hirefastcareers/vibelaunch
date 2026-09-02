import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validators";
import { validateMediaUrls } from "@/lib/media/engine";
import { enqueuePost } from "@/lib/queue/qstash";
import { isDemoMode } from "@/lib/demo-mode";
import { assertCanCreatePost, UsageLimitError } from "@/lib/billing/limits";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = await prisma.post.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { analytics: true },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isDemoMode()) {
    try {
      await assertCanCreatePost(session.user.id);
    } catch (err) {
      if (err instanceof UsageLimitError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 403 },
        );
      }
      throw err;
    }
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mediaUrls = parsed.data.mediaUrls ?? [];
  if (mediaUrls.length > 0) {
    const validation = validateMediaUrls(mediaUrls);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors }, { status: 400 });
    }
  }

  const scheduledAt = parsed.data.scheduledAt
    ? new Date(parsed.data.scheduledAt)
    : null;

  const post = await prisma.post.create({
    data: {
      projectId: id,
      content: parsed.data.content,
      mediaUrls,
      scheduledAt,
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
