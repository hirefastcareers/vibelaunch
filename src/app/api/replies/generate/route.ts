import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateSmartReply } from "@/lib/generator/reply";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  originalPost: z.string().min(1).max(4000),
  keyword: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { originalPost, keyword, projectId, projectName } = parsed.data;

  const project = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        select: { name: true, tagline: true, description: true, tone: true },
      })
    : await prisma.project.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        select: { name: true, tagline: true, description: true, tone: true },
      });

  const reply = await generateSmartReply(originalPost, {
    keyword,
    project: project
      ? project
      : projectName
        ? { name: projectName }
        : null,
  });

  return NextResponse.json({ reply, configured: true });
}
