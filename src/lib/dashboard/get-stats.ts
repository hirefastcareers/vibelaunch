import { prisma } from "@/lib/prisma";
import { FEATURES } from "@/lib/feature-flags";

export type DashboardUser = {
  name: string | null;
  xUsername: string | null;
};

export type DashboardStats = {
  stats: {
    impressionsVelocity: number;
    totalImpressions: number;
    avgEri: number;
    seoPagesPublished: number;
    postCount: number;
    publishedCount: number;
    draftCount: number;
    impressionsTrend: number | null;
    eriTrendPct: number | null;
  };
  user: DashboardUser;
  topPosts: Array<{
    id: string;
    content: string;
    eri: number;
    impressions: number;
    likes: number;
    publishedAt: string | null;
    xPostUrl: string | null;
    mediaUrls: string[];
  }>;
  eriTrend: Array<{ date: string; eri: number }>;
  projects: Array<{ id: string; name: string }>;
};

export function emptyDashboardStats(user: DashboardUser): DashboardStats {
  return {
    stats: {
      impressionsVelocity: 0,
      totalImpressions: 0,
      avgEri: 0,
      seoPagesPublished: 0,
      postCount: 0,
      publishedCount: 0,
      draftCount: 0,
      impressionsTrend: null,
      eriTrendPct: null,
    },
    user,
    topPosts: [],
    eriTrend: [],
    projects: [],
  };
}

export async function getDashboardStats(
  userId: string,
  user: DashboardUser
): Promise<DashboardStats> {
  const [posts, changelogs, snapshots, projects] = await Promise.all([
    prisma.post.findMany({
      where: { project: { userId } },
      include: { analytics: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.changelogEntry.count({
      where: { project: { userId }, published: true },
    }),
    prisma.eriSnapshot.findMany({
      where: { project: { userId } },
      orderBy: { snapshotAt: "asc" },
      take: 30,
    }),
    prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
  ]);

  const publishedPosts = posts.filter((p) => p.status === "PUBLISHED");
  const draftCount = posts.filter((p) => p.status === "DRAFT" || p.status === "FAILED").length;
  const totalImpressions = publishedPosts.reduce(
    (sum, p) => sum + (p.analytics?.impressions ?? 0),
    0
  );

  const recentImpressions = publishedPosts
    .filter((p) => p.publishedAt && p.publishedAt > new Date(Date.now() - 7 * 86400000))
    .reduce((sum, p) => sum + (p.analytics?.impressions ?? 0), 0);

  const avgEri =
    publishedPosts.length > 0
      ? publishedPosts.reduce((sum, p) => sum + (p.analytics?.eri ?? 0), 0) /
        publishedPosts.length
      : 0;

  const topPosts = publishedPosts
    .filter((p) => p.analytics || p.publishedAt)
    .sort((a, b) => {
      if (FEATURES.ERI_ANALYTICS) {
        return (b.analytics?.eri ?? 0) - (a.analytics?.eri ?? 0);
      }
      const bt = b.publishedAt?.getTime() ?? 0;
      const at = a.publishedAt?.getTime() ?? 0;
      return bt - at;
    })
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      content: p.content,
      eri: p.analytics?.eri ?? 0,
      impressions: p.analytics?.impressions ?? 0,
      likes: p.analytics?.likes ?? 0,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      xPostUrl: p.xPostUrl,
      mediaUrls: p.mediaUrls,
    }));

  const priorWeekImpressions = publishedPosts
    .filter(
      (p) =>
        p.publishedAt &&
        p.publishedAt > new Date(Date.now() - 14 * 86400000) &&
        p.publishedAt <= new Date(Date.now() - 7 * 86400000)
    )
    .reduce((sum, p) => sum + (p.analytics?.impressions ?? 0), 0);
  const impressionsTrend =
    priorWeekImpressions > 0
      ? Math.round(((recentImpressions - priorWeekImpressions) / priorWeekImpressions) * 1000) / 10
      : null;

  const prevEri = snapshots.length >= 2 ? snapshots[snapshots.length - 2].avgEri : 0;
  const eriTrendPct =
    snapshots.length >= 2
      ? Math.round(
          ((snapshots[snapshots.length - 1].avgEri - prevEri) / (prevEri || 1)) * 1000
        ) / 10
      : null;

  const eriTrend = snapshots.map((s) => ({
    date: s.snapshotAt.toISOString().split("T")[0],
    eri: Math.round(s.avgEri * 100) / 100,
  }));

  return {
    stats: {
      impressionsVelocity: recentImpressions,
      totalImpressions,
      avgEri: Math.round(avgEri * 100) / 100,
      seoPagesPublished: changelogs,
      postCount: posts.length,
      publishedCount: publishedPosts.length,
      draftCount,
      impressionsTrend,
      eriTrendPct,
    },
    user,
    topPosts,
    eriTrend,
    projects,
  };
}
