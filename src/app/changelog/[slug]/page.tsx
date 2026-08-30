import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await prisma.changelogEntry.findUnique({
    where: { slug, published: true },
    include: { project: { select: { name: true } } },
  });

  if (!entry) return { title: "Not Found" };

  return {
    title: entry.seoTitle ?? entry.title,
    description: entry.seoDesc ?? entry.summary,
    keywords: entry.keywords,
    openGraph: {
      title: entry.seoTitle ?? entry.title,
      description: entry.seoDesc ?? entry.summary,
      type: "article",
      publishedTime: entry.publishedAt?.toISOString(),
    },
  };
}

export default async function ChangelogPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await prisma.changelogEntry.findUnique({
    where: { slug, published: true },
    include: { project: { select: { name: true, slug: true } } },
  });

  if (!entry) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <p className="text-sm text-gray-500 mb-2">
          {entry.project.name} ·{" "}
          {entry.publishedAt?.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-4xl font-bold text-gray-900">{entry.title}</h1>
        <p className="mt-4 text-lg text-gray-600">{entry.summary}</p>
      </header>
      <div
        className="prose prose-gray max-w-none"
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
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {entry.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
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
