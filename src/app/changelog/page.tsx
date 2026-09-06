import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Changelog | Xoopa",
  description: "Product updates published as indexed articles.",
};

async function loadEntries() {
  try {
    return await prisma.changelogEntry.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
        project: { select: { name: true } },
      },
      take: 50,
    });
  } catch (error) {
    console.error("[changelog] failed to load entries", error);
    return [];
  }
}

export default async function ChangelogIndexPage() {
  const entries = await loadEntries();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="mb-10 inline-flex">
        <Logo size={28} />
      </Link>
      <p className="ds-kicker">Updates</p>
      <h1 className="mt-2 text-[36px] md:text-[44px]">Changelog</h1>
      <p className="mt-3 max-w-[46ch] text-muted-foreground">
        Articles Xoopa publishes from product updates. Each entry is a static,
        indexable page.
      </p>

      {entries.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No published articles yet. Sign in and publish one from Command Center.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-border rounded-xl border border-border bg-background">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/changelog/${entry.slug}`}
                className="block px-5 py-5 transition-colors hover:bg-muted/40"
              >
                <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
                  {entry.project.name}
                  {entry.publishedAt
                    ? ` / ${entry.publishedAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`
                    : ""}
                </p>
                <h2 className="mt-1 text-xl">{entry.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {entry.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
