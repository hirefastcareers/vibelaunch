import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Marketing + published content sitemap.
 * Add future static marketing routes to `marketingPages` (blog, comparisons, etc.)
 * so they appear without editing the generator body each time.
 */
const marketingPages: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  // Future: { path: "/blog", ... }, { path: "/compare/...", ... }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const entries = await prisma.changelogEntry
    .findMany({
      where: { published: true },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    })
    .catch(() => []);

  return [
    ...marketingPages.map((page) => ({
      url: page.path === "/" ? baseUrl : `${baseUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...entries.map((e) => ({
      url: `${baseUrl}/changelog/${e.slug}`,
      lastModified: e.publishedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
