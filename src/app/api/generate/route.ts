import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateContentSchema } from "@/lib/validators";
import { generateAdaptiveContent } from "@/lib/generator/adaptive";
import { isDemoMode, DEMO_GENERATED } from "@/lib/demo";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = generateContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ generated: DEMO_GENERATED });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const generated = await generateAdaptiveContent(
    parsed.data.projectId,
    parsed.data.topic,
    parsed.data.tone
  );

  return NextResponse.json({ generated });
}
