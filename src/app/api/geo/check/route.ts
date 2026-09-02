import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_GEO_CHECK } from "@/lib/mock-data";
import { checkLLMCitations } from "@/lib/geo/citation-tracker";
import { buildCitationTrend, buildGeoDashboardData } from "@/lib/geo/analytics";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { projectId?: string };
  const userId = session.user.id;

  if (isDemoMode()) {
    await demoDelay(1500);
    return NextResponse.json(MOCK_GEO_CHECK);
  }

  const project = body.projectId
    ? await prisma.project.findFirst({ where: { id: body.projectId, userId } })
    : await prisma.project.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 404 });
  }

  const result = await checkLLMCitations(project.id);

  const metrics = await prisma.geoMetric.findMany({
    where: { projectId: project.id },
    orderBy: { checkedAt: "desc" },
    take: 90,
  });

  const dashboard = buildGeoDashboardData(metrics, project.name);

  return NextResponse.json({
    ...result,
    projectName: project.name,
    ...dashboard,
    citationTrend: buildCitationTrend(metrics),
  });
}
