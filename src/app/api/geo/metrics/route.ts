import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_GEO } from "@/lib/mock-data";
import { buildGeoDashboardData } from "@/lib/geo/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    await demoDelay();
    return NextResponse.json(MOCK_GEO);
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  const userId = session.user.id;

  const project = projectId
    ? await prisma.project.findFirst({ where: { id: projectId, userId } })
    : await prisma.project.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 404 });
  }

  const metrics = await prisma.geoMetric.findMany({
    where: { projectId: project.id },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });

  const dashboard = buildGeoDashboardData(metrics, project.name);

  return NextResponse.json({
    projectId: project.id,
    projectName: project.name,
    ...dashboard,
  });
}
