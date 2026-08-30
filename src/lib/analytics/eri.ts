/**
 * Engagement Rate Index (ERI) calculation.
 * ERI = (likes + retweets*2 + replies*1.5 + clicks*0.5) / max(impressions, 1) * 100
 */
export function calculateEri(metrics: {
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  clicks?: number;
}): number {
  const { impressions, likes, retweets, replies, clicks = 0 } = metrics;
  if (impressions === 0) return 0;

  const engagement = likes + retweets * 2 + replies * 1.5 + clicks * 0.5;
  return Math.round((engagement / impressions) * 10000) / 100;
}

export function rankPostsByEri<
  T extends { eri: number; impressions: number }
>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    if (b.eri !== a.eri) return b.eri - a.eri;
    return b.impressions - a.impressions;
  });
}

export interface EriSnapshotData {
  avgEri: number;
  topPostId: string | null;
  postCount: number;
}

export function computeProjectEriSnapshot(
  analytics: Array<{ postId: string; eri: number }>
): EriSnapshotData {
  if (analytics.length === 0) {
    return { avgEri: 0, topPostId: null, postCount: 0 };
  }

  const avgEri =
    analytics.reduce((sum, a) => sum + a.eri, 0) / analytics.length;

  const top = analytics.reduce((best, a) => (a.eri > best.eri ? a : best));

  return {
    avgEri: Math.round(avgEri * 100) / 100,
    topPostId: top.postId,
    postCount: analytics.length,
  };
}
