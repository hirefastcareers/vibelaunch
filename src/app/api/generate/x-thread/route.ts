import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_X_THREAD } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const threadSchema = z.object({
  projectId: z.string().optional(),
  topic: z.string().min(1).max(200).optional(),
  tone: z.enum(["professional", "casual", "hype", "technical", "build-in-public"]).optional(),
  parts: z.number().min(2).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = threadSchema.safeParse(body);

  if (isDemoMode()) {
    await demoDelay();
    const parts = parsed.success ? parsed.data.parts : undefined;
    const thread = parts
      ? MOCK_X_THREAD.thread.slice(0, parts)
      : MOCK_X_THREAD.thread;

    return NextResponse.json({
      ...MOCK_X_THREAD,
      thread,
      message: "Demo: X thread generated successfully (simulated)",
    });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { generateThread } = await import("@/lib/ai/generator");
  const thread = await generateThread({
    projectId: parsed.data.projectId ?? "default",
    topic: parsed.data.topic ?? "product launch",
    tone: (parsed.data.tone as "casual") ?? "casual",
    parts: parsed.data.parts,
  });

  return NextResponse.json({ thread, tone: parsed.data.tone ?? "casual" });
}
