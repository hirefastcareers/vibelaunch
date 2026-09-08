import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { publishReplyToX, XApiError } from "@/lib/x/publish";
import { XAuthError } from "@/lib/x/token";

export const dynamic = "force-dynamic";

const postReplySchema = z.object({
  content: z.string().min(1).max(280),
  inReplyToTweetId: z.string().min(1).max(32),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = postReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await publishReplyToX(
      session.user.id,
      parsed.data.content,
      parsed.data.inReplyToTweetId
    );
    return NextResponse.json({ id: result.id, url: result.url });
  } catch (error) {
    if (error instanceof XAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 401 }
      );
    }
    if (error instanceof XApiError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }
    console.error("[replies/post]", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
