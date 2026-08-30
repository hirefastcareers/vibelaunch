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
    return NextResponse.json({ reply: match?.suggestedReply ?? MOCK_AI_REPLY });
  }

  const reply = await generateSmartReply(originalPost, keyword, parsed.data.projectName);

  return NextResponse.json({ reply });
}

async function generateSmartReply(
  originalPost: string,
  keyword?: string,
  projectName?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    const prompt = `Write a helpful, non-spammy X/Twitter reply (max 280 chars) to this post:

"${originalPost}"

Context: monitoring ${keyword ?? "relevant conversations"}${projectName ? ` for ${projectName}` : ""}.
Be genuine, add value, no self-promotion unless naturally relevant. Return ONLY the reply text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      return data.choices[0].message.content.trim().slice(0, 280);
    }
  }

  return generateFallbackReply(originalPost, keyword);
}

function generateFallbackReply(originalPost: string, keyword?: string): string {
  if (originalPost.toLowerCase().includes("mrr") || originalPost.toLowerCase().includes("revenue")) {
    return "Congrats on the milestone! Curious — what was the biggest lever for growth in your case?";
  }
  if (keyword?.includes("vibecoding")) {
    return "Totally agree — AI scaffolds fast, but tests and review are what make it production-ready.";
  }
  if (keyword?.includes("micro-saas")) {
    return "Love seeing niche tools win. Focused problem + simple pricing seems to be the pattern.";
  }
  return "Great insight — thanks for sharing this openly. Really resonates with the build-in-public journey.";
}
