import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dispatchPostPublish } from "@/lib/queue/dispatch-post";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  const post = await prisma.post.findFirst({
    where: { id: postId },
    include: { project: true },
  });

  if (!post || post.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.status === "PUBLISHED") {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  try {
    const result = await dispatchPostPublish({
      postId: post.id,
      projectId: post.projectId,
      userId: session.user.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      scheduledAt: post.scheduledAt,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
