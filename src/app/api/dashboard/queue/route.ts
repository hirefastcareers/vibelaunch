import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDemoMode, DEMO_QUEUE } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json(DEMO_QUEUE);
  }

  const posts = await prisma.post.findMany({
    where: { project: { userId: session.user.id } },
    include: {
      analytics: true,
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = posts.map((p) => ({
    id: p.id,
    content: p.content,
    status: p.status,
    mediaUrls: p.mediaUrls,
    scheduledAt: p.scheduledAt,
    publishedAt: p.publishedAt,
    projectId: p.projectId,
    projectName: p.project.name,
    eri: p.analytics?.eri ?? null,
    xPostUrl: p.xPostUrl,
  }));

  return NextResponse.json({
    pending: mapped.filter((p) => ["DRAFT", "QUEUED"].includes(p.status)),
    scheduled: mapped.filter((p) => p.status === "SCHEDULED"),
    published: mapped.filter((p) => p.status === "PUBLISHED"),
  });
}
