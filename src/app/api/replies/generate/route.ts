import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_AI_REPLY, MOCK_SMART_REPLIES_FEED } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  originalPost: z.string().min(1),
  keyword: z.string().optional(),
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

  const { originalPost, keyword } = parsed.data;

  if (isDemoMode()) {
    await demoDelay();
    const feed = keyword ? MOCK_SMART_REPLIES_FEED[keyword] : undefined;
    const match = feed?.find((item) => item.content === originalPost);
    return NextResponse.json({
      reply: match?.suggestedReply ?? MOCK_AI_REPLY,
      configured: true,
    });
  }

  return NextResponse.json(
    {
      error: "Smart replies aren't connected to a live feed yet.",
      configured: false,
    },
    { status: 503 }
  );
}
