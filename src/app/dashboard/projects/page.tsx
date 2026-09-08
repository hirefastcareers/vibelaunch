import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";
import { DeleteProjectButton } from "@/components/dashboard/delete-project-button";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      _count: { select: { posts: true, changelog: true } },
    },
  });

  return (
    <DashboardPage>
      <PageHeader
        title="Projects"
        description="Free plans include one project. Delete a test project before onboarding Xoopa."
        actions={
          <Button asChild size="sm">
            <Link href="/onboard">Add project</Link>
          </Button>
        }
      />

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-5 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Onboard a product URL so Xoopa can draft posts and articles.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/onboard">Create project</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {project.name}
                </Link>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {project.websiteUrl ?? "No website URL"}
                  {" · "}
                  {project._count.posts} posts
                  {" · "}
                  {project._count.changelog} articles
                </p>
              </div>
              <DeleteProjectButton projectId={project.id} projectName={project.name} />
            </li>
          ))}
        </ul>
      )}
    </DashboardPage>
  );
}
