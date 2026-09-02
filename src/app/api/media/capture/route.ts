import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { enqueueSiteCapture } from "@/lib/queue/qstash";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let projectId: unknown;
  try {
    const body = await req.json();
    projectId = body?.projectId;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.websiteUrl) {
    return NextResponse.json({ error: "Project has no websiteUrl" }, { status: 400 });
  }

  try {
    const messageId = await enqueueSiteCapture({ projectId: project.id });
    return NextResponse.json({ messageId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Queue failed" },
      { status: 500 }
    );
  }
}
