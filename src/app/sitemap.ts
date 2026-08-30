import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/env";
import { isDemoMode } from "@/lib/demo-mode";
import { MOCK_SEO_PUBLISH } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  if (isDemoMode()) {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      {
        url: `${baseUrl}/changelog/${MOCK_SEO_PUBLISH.entry.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
  }

  const entries = await prisma.changelogEntry.findMany({
    where: { published: true },
    select: { slug: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  }).catch(() => []);

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...entries.map((e) => ({
      url: `${baseUrl}/changelog/${e.slug}`,
      lastModified: e.publishedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
