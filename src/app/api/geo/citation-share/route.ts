import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { buildCitationShareDemo } from "@/lib/geo/citation-share-demo";
import { buildCitationDashboard } from "@/lib/geo/citation-analytics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET live citation dashboard for the signed-in user.
 * Falls back to labeled demo payload only when isDemoMode() AND no live runs exist.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const liveRunCount = await prisma.citationRun.count({
    where: { trackedQuery: { userId: session.user.id }, error: null },
  });

  if (liveRunCount > 0) {
    const dashboard = await buildCitationDashboard(session.user.id);
    return NextResponse.json(dashboard);
  }

  if (isDemoMode()) {
    await demoDelay(300);
    const queries = await prisma.trackedQuery.findMany({
      where: { userId: session.user.id },
      take: 5,
    });
    const brand = queries[0]?.brandName ?? "Your brand";
    const prompts = queries.map((q) => q.promptText);
    const demo = buildCitationShareDemo(brand, prompts);
    return NextResponse.json({
      demo: true as const,
      brandName: demo.brandName,
      trackedQueries: queries.map((q) => ({
        id: q.id,
        brandName: q.brandName,
        promptText: q.promptText,
        active: q.active,
      })),
      rows: demo.rows.map((row) => ({
        model: mapDemoProvider(row.provider),
        label: row.label,
        mentionRate: row.citationShare,
        mentioned: row.citedQueries,
        total: row.totalQueries,
        recentCitedUrls: [] as string[],
      })),
      trend: demo.trend.map((point) => ({
        date: point.date,
        openai: point.chatgpt,
        anthropic: point.claude,
        gemini: point.gemini,
        perplexity: point.perplexity,
        grok: point.grok,
      })),
      mentionTrend: demo.trend.map((point) => ({
        date: point.date,
        mentionRate: Math.round(
          (point.chatgpt +
            point.perplexity +
            point.claude +
            point.gemini +
            point.grok) /
            5
        ),
      })),
      recentUrls: [] as string[],
      note: `${demo.note} Live pipeline is ready — save tracked queries and run a sweep to replace this stub.`,
    });
  }

  const empty = await buildCitationDashboard(session.user.id);
  return NextResponse.json(empty);
}

function mapDemoProvider(
  provider: "chatgpt" | "perplexity" | "claude" | "gemini" | "grok"
): "openai" | "anthropic" | "gemini" | "perplexity" | "grok" {
  switch (provider) {
    case "chatgpt":
      return "openai";
    case "claude":
      return "anthropic";
    case "gemini":
      return "gemini";
    case "perplexity":
      return "perplexity";
    case "grok":
      return "grok";
  }
}
