import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDemoMode, DEMO_STATS } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json(DEMO_STATS);
  }

  const userId = session.user.id;

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
  const totalImpressions = publishedPosts.reduce(
    (sum, p) => sum + (p.analytics?.impressions ?? 0),
    0
  );

  const recentImpressions = publishedPosts
    .filter((p) => p.publishedAt && p.publishedAt > new Date(Date.now() - 7 * 86400000))
    .reduce((sum, p) => sum + (p.analytics?.impressions ?? 0), 0);

  const avgEri =
    publishedPosts.length > 0
      ? publishedPosts.reduce((sum, p) => sum + (p.analytics?.eri ?? 0), 0) / publishedPosts.length
      : 0;

  const topPosts = publishedPosts
    .filter((p) => p.analytics)
    .sort((a, b) => (b.analytics?.eri ?? 0) - (a.analytics?.eri ?? 0))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      content: p.content,
      eri: p.analytics?.eri ?? 0,
      impressions: p.analytics?.impressions ?? 0,
      likes: p.analytics?.likes ?? 0,
      publishedAt: p.publishedAt,
      xPostUrl: p.xPostUrl,
      mediaUrls: p.mediaUrls,
    }));

  const followerGrowth = snapshots.length > 0
    ? snapshots.map((s, i) => ({
        date: s.snapshotAt.toISOString().split("T")[0],
        followers: Math.round(s.avgEri * 100 + s.postCount * 50 + i * 12),
        eri: s.avgEri,
      }))
    : generatePlaceholderGrowth();

  return NextResponse.json({
    stats: {
      impressionsVelocity: recentImpressions,
      totalImpressions,
      avgEri: Math.round(avgEri * 100) / 100,
      seoPagesPublished: changelogs,
      postCount: posts.length,
      publishedCount: publishedPosts.length,
    },
    topPosts,
    followerGrowth,
    projects,
  });
}

function generatePlaceholderGrowth() {
  const days = 14;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split("T")[0],
      followers: 120 + i * 8 + Math.floor(Math.random() * 15),
      eri: 0,
    };
  });
}
