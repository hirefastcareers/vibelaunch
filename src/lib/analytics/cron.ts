import { prisma } from "@/lib/prisma";
import { calculateEri } from "./eri";
import { fetchTweetMetrics } from "@/lib/x/publish";

/**
 * Run ERI analytics cron: fetch metrics for all published posts and snapshot project ERI.
 */
export async function runEriAnalyticsCron(): Promise<{
  processed: number;
  snapshots: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let snapshots = 0;

  const publishedPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED", xPostId: { not: null } },
    include: {
      project: { select: { userId: true } },
      analytics: true,
    },
  });

  const projectAnalytics = new Map<string, Array<{ postId: string; eri: number }>>();

  for (const post of publishedPosts) {
    if (!post.xPostId) continue;

    try {
      const metrics = await fetchTweetMetrics(post.project.userId, post.xPostId);
      const eri = calculateEri(metrics);

      await prisma.postAnalytics.upsert({
        where: { postId: post.id },
        create: {
          postId: post.id,
          ...metrics,
          eri,
        },
        update: {
          ...metrics,
          eri,
          fetchedAt: new Date(),
        },
      });

      const existing = projectAnalytics.get(post.projectId) ?? [];
      existing.push({ postId: post.id, eri });
      projectAnalytics.set(post.projectId, existing);

      processed++;
    } catch (err) {
      errors.push(`Post ${post.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  for (const [projectId, analytics] of projectAnalytics) {
    const avgEri =
      analytics.reduce((sum, a) => sum + a.eri, 0) / analytics.length;
    const top = analytics.reduce((best, a) => (a.eri > best.eri ? a : best));

    await prisma.eriSnapshot.create({
      data: {
        projectId,
        avgEri: Math.round(avgEri * 100) / 100,
        topPostId: top.postId,
        postCount: analytics.length,
      },
    });
    snapshots++;
  }

  return { processed, snapshots, errors };
}
