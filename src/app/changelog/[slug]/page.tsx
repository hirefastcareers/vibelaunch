import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/env";
import { buildGeoJsonLd, serializeJsonLd } from "@/lib/geo/llm-schema";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await prisma.changelogEntry.findUnique({
    where: { slug, published: true },
    include: { project: { select: { name: true } } },
  });

  if (!entry) return { title: "Not Found" };

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/changelog/${slug}`;

  return {
    title: entry.seoTitle ?? entry.title,
    description: entry.seoDesc ?? entry.summary,
    keywords: entry.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: entry.seoTitle ?? entry.title,
      description: entry.seoDesc ?? entry.summary,
      type: "article",
      publishedTime: entry.publishedAt?.toISOString(),
      url: canonicalUrl,
      images: [{ url: `${baseUrl}/api/media/generate?type=code-card&id=${entry.slug}` }],
    },
  };
}

export default async function ChangelogPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await prisma.changelogEntry.findUnique({
    where: { slug, published: true },
    include: {
      project: {
        select: {
          name: true,
          slug: true,
          websiteUrl: true,
          description: true,
          tagline: true,
          keywords: true,
        },
      },
    },
  });

  if (!entry) notFound();

  const baseUrl = getBaseUrl();
  const projectUrl =
    entry.project.websiteUrl ?? `${baseUrl}/changelog/${entry.slug}`;
  const changelogUrl = `${baseUrl}/changelog/${entry.slug}`;

  const jsonLd = buildGeoJsonLd({
    projectName: entry.project.name,
    projectUrl,
    description:
      entry.project.description ??
      entry.summary ??
      `${entry.project.name} changelog update`,
    tagline: entry.project.tagline,
    keywords: entry.project.keywords,
    changelogTitle: entry.title,
    changelogSummary: entry.summary,
    changelogUrl,
  });

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <header className="mb-8">
        <p className="font-mono text-[11px] tracking-wider text-muted-foreground mb-2">
          {entry.project.name} /{" "}
          {entry.publishedAt?.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-4xl">{entry.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{entry.summary}</p>
      </header>
      <div
        className="max-w-none space-y-4 text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: entry.body
            .replace(/^# (.+)$/gm, "<h2>$1</h2>")
            .replace(/^## (.+)$/gm, "<h3>$1</h3>")
            .replace(/^### (.+)$/gm, "<h4>$1</h4>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/^(.+)$/gm, (m) =>
              m.startsWith("<h") ? m : `<p>${m}</p>`
            ),
        }}
      />
      {entry.keywords.length > 0 && (
        <footer className="mt-12 pt-6 border-t border-stone-800">
          <div className="flex flex-wrap gap-2">
            {entry.keywords.map((kw) => (
              <span
                key={kw}
                className="px-1.5 py-0.5 border border-stone-800 font-mono text-[10px] tracking-wider text-muted-foreground rounded-sm"
              >
                {kw}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
