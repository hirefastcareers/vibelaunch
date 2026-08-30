import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-indigo-600 text-sm hover:underline">
        ← Back to Dashboard
      </Link>

      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{project.status}</span>
        </div>
        {project.tagline && <p className="mt-2 text-gray-600">{project.tagline}</p>}
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
          {project.posts.length === 0 ? (
            <p className="text-gray-500 text-sm">No posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {project.posts.map((post) => (
                <li key={post.id} className="bg-white p-4 rounded-lg border text-sm">
                  <p className="text-gray-800">{post.content}</p>
                  <div className="mt-2 flex gap-3 text-xs text-gray-500">
                    <span>{post.status}</span>
                    {post.analytics && <span>ERI {post.analytics.eri}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Changelog</h2>
          {project.changelog.length === 0 ? (
            <p className="text-gray-500 text-sm">No changelog entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {project.changelog.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/changelog/${entry.slug}`}
                    className="block bg-white p-4 rounded-lg border hover:border-indigo-300 text-sm"
                  >
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-gray-500 mt-1">{entry.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {project.analytics.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">ERI Snapshots</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Avg ERI</th>
                  <th className="text-left p-3">Posts</th>
                </tr>
              </thead>
              <tbody>
                {project.analytics.map((snap) => (
                  <tr key={snap.id} className="border-t">
                    <td className="p-3">{snap.snapshotAt.toLocaleDateString()}</td>
                    <td className="p-3">{snap.avgEri}</td>
                    <td className="p-3">{snap.postCount}</td>
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
