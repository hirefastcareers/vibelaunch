import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const userLabel = session.user.xUsername
    ? `@${session.user.xUsername}`
    : session.user.name ?? "Signed in";

  return <DashboardShell userLabel={userLabel}>{children}</DashboardShell>;
}
