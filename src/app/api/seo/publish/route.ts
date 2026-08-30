import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { seoPublishSchema } from "@/lib/validators";
import { expandForSeo } from "@/lib/seo/expander";
import { requestGoogleIndexing } from "@/lib/seo/google-indexing";
import { getBaseUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = seoPublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const expanded = await expandForSeo(
    parsed.data.title,
    parsed.data.summary,
    project.name,
    parsed.data.keywords
  );

  const existingSlug = await prisma.changelogEntry.findUnique({
    where: { slug: expanded.slug },
  });
  const slug = existingSlug
    ? `${expanded.slug}-${Date.now()}`
    : expanded.slug;

  const entry = await prisma.changelogEntry.create({
    data: {
      projectId: project.id,
      slug,
      title: parsed.data.title,
      summary: parsed.data.summary,
      body: expanded.body,
      seoTitle: expanded.seoTitle,
      seoDesc: expanded.seoDesc,
      keywords: expanded.keywords,
      published: true,
      publishedAt: new Date(),
    },
  });

  const appUrl = getBaseUrl();
  const changelogUrl = `${appUrl}/changelog/${entry.slug}`;

  const indexing = await requestGoogleIndexing(changelogUrl);

  if (indexing.success) {
    await prisma.changelogEntry.update({
      where: { id: entry.id },
      data: { indexedAt: new Date() },
    });
  }

  return NextResponse.json(
    {
      entry,
      url: changelogUrl,
      indexing,
    },
    { status: 201 }
  );
}
