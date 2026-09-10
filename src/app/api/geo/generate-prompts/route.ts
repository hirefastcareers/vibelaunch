import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  generateTrackedPrompts,
  PromptGenerationError,
} from "@/lib/geo/generate-tracked-prompts";

export const dynamic = "force-dynamic";

/**
 * Generate 8–10 buyer-intent tracked prompts for citation onboarding.
 * Honest failure: never returns invented prompts when OpenAI fails.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      brandName: z.string().trim().min(1).max(120),
      websiteUrl: z.string().trim().url().max(500),
      descriptors: z
        .array(z.string().trim().min(2).max(80))
        .min(2)
        .max(4),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Provide brand name, a valid website URL, and 2–4 short descriptors",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateTrackedPrompts(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PromptGenerationError) {
      console.error("[generate-prompts]", err.message);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[generate-prompts] unexpected", err);
    return NextResponse.json(
      { error: "Prompt generation failed" },
      { status: 500 }
    );
  }
}
