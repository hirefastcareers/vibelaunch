import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { posts: true, changelog: true } },
      analytics: { orderBy: { snapshotAt: "desc" }, take: 1 },
    },
  });

  return (
    <main className="min-h-screen">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            VibeLaunch
          </Link>
          <span className="text-sm text-gray-500">
            {session.user.xUsername ? `@${session.user.xUsername}` : session.user.name}
          </span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Projects</h1>
          <Link
            href="/dashboard/projects/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-4">No projects yet. Create your first launch project.</p>
            <Link
              href="/dashboard/projects/new"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create Project →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {project.status}
                  </span>
                </div>
                {project.tagline && (
                  <p className="text-sm text-gray-600 mb-4">{project.tagline}</p>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{project._count.posts} posts</span>
                  <span>{project._count.changelog} changelogs</span>
                  {project.analytics[0] && (
                    <span>ERI {project.analytics[0].avgEri}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
