export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDashboardStats } from "@/lib/dashboard/get-stats";
import DashboardHome from "./dashboard-content";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const data = await getDashboardStats(session.user.id, {
    name: session.user.name ?? null,
    xUsername: session.user.xUsername ?? null,
  });

  return <DashboardHome data={data} />;
}
