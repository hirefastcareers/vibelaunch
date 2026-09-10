export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { emptyDashboardStats, getDashboardStats } from "@/lib/dashboard/get-stats";
import { isDemoMode } from "@/lib/demo-mode";
import DashboardHome from "./dashboard-content";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  const user = {
    name: session.user.name ?? null,
    xUsername: session.user.xUsername ?? null,
  };

  let data;
  try {
    data = await getDashboardStats(session.user.id, user);
  } catch (error) {
    console.error("[dashboard] failed to load stats", error);
    data = emptyDashboardStats(user);
  }

  return <DashboardHome data={data} demoMode={isDemoMode()} />;
}
