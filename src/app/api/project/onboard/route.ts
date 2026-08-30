import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scrapeUrl } from "@/lib/scraper/url-scraper";
import { slugify } from "@/lib/utils";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_PROJECT, MOCK_SCRAPED_CONTEXT } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const onboardSchema = z.object({
  targetUrl: z.string().url(),
  projectName: z.string().min(1).max(100),
  tone: z.enum(["build-in-public", "unfiltered", "technical", "minimalist"]),
  keywords: z.array(z.string()).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = onboardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetUrl, projectName, tone, keywords: inputKeywords } = parsed.data;

  if (isDemoMode()) {
    await demoDelay();
    const slug = slugify(projectName);
    const keywords = [
      ...(inputKeywords ?? []),
      ...MOCK_SCRAPED_CONTEXT.keywords,
    ].filter((k, i, arr) => arr.indexOf(k) === i).slice(0, 20);

    return NextResponse.json(
      {
        project: {
          ...MOCK_PROJECT,
          id: `demo-${slug}`,
          name: projectName,
          slug,
          websiteUrl: targetUrl,
          tone,
          keywords,
        },
        scraped: {
          ...MOCK_SCRAPED_CONTEXT,
          title: projectName,
        },
        message: "Demo: project onboarded successfully (simulated)",
      },
      { status: 201 }
    );
  }

  const scraped = await scrapeUrl(targetUrl);
  const slug = slugify(projectName);
  const keywords = [
    ...(inputKeywords ?? []),
    ...scraped.keywords,
  ].filter((k, i, arr) => arr.indexOf(k) === i).slice(0, 20);

  const existing = await prisma.project.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: projectName,
      slug: finalSlug,
      websiteUrl: targetUrl,
      description: scraped.description,
      tagline: scraped.tagline,
      tone,
      keywords,
      status: "ACTIVE",
    },
  });

  try {
    const contextText = `${projectName}. ${scraped.description}. Keywords: ${keywords.join(", ")}. Tone: ${tone}`;
    const { generateEmbedding } = await import("@/lib/vector/embeddings");
    await generateEmbedding(contextText);
  } catch {
    // Non-fatal during onboarding
  }

  return NextResponse.json(
    { project, scraped, message: "Project onboarded successfully" },
    { status: 201 }
  );
}
