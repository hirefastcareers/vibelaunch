import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";

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

  return NextResponse.json(
    {
      error: "Smart replies aren't connected to a live feed yet.",
      configured: false,
    },
    { status: 503 }
  );
}
