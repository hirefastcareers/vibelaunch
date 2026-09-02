import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      posts: { orderBy: { createdAt: "desc" }, take: 10, include: { analytics: true } },
      changelog: { orderBy: { createdAt: "desc" }, take: 5 },
      analytics: { orderBy: { snapshotAt: "desc" }, take: 5 },
    },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="font-mono text-[11px] tracking-wider text-muted-foreground hover:text-foreground">
        BACK
      </Link>

      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-5xl">{project.name}</h1>
          <StatusPill>{`[${project.status}]`}</StatusPill>
        </div>
        {project.tagline && <p className="mt-2 text-muted-foreground">{project.tagline}</p>}
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl mb-4">Recent Posts</h2>
          {project.posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet.</p>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {project.posts.map((post) => (
                <li key={post.id} className="bg-card p-4 text-sm">
                  <p className="font-mono">{post.content}</p>
                  <div className="mt-2 flex gap-3 font-mono text-[10px] text-muted-foreground">
                    <span>{post.status}</span>
                    {post.analytics && (
                      <StatusPill>{`[VIRALITY: ${post.analytics.eri}]`}</StatusPill>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-2xl mb-4">Changelog</h2>
          {project.changelog.length === 0 ? (
            <p className="text-muted-foreground text-sm">No changelog entries yet.</p>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {project.changelog.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/changelog/${entry.slug}`}
                    className="block bg-card p-4 hover:bg-secondary text-sm"
                  >
                    <p>{entry.title}</p>
                    <p className="text-muted-foreground mt-1">{entry.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {project.analytics.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl mb-4">Virality Snapshots</h2>
          <div className="border border-border overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead className="bg-card text-[10px] tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">DATE</th>
                  <th className="text-left p-3">AVG VIRALITY</th>
                  <th className="text-left p-3">POSTS</th>
                </tr>
              </thead>
              <tbody>
                {project.analytics.map((snap) => (
                  <tr key={snap.id} className="border-t border-border">
                    <td className="p-3">{snap.snapshotAt.toLocaleDateString()}</td>
                    <td className="p-3 tabular-nums">{snap.avgEri}</td>
                    <td className="p-3 tabular-nums">{snap.postCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
