import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

/**
 * Auth + citation onboarding gate.
 * Users with zero TrackedQuery rows must finish /onboard/citations
 * before any dashboard page (including billing).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const trackedCount = await prisma.trackedQuery.count({
    where: { userId: session.user.id },
  });
  if (trackedCount === 0) {
    redirect("/onboard/citations");
  }

  const userLabel = session.user.xUsername
    ? `@${session.user.xUsername}`
    : session.user.name ?? "Signed in";

  return <DashboardShell userLabel={userLabel}>{children}</DashboardShell>;
}
