import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

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
