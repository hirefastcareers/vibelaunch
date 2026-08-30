import { prisma } from "@/lib/prisma";
import type { DiagnosticAssertion, SuiteResult } from "../types";
import { computeSuiteScore, deriveSuiteStatus } from "../scoring";

const ERI_THRESHOLD = 2.0;

export async function runFeedbackLoopAudit(projectId: string): Promise<SuiteResult> {
  const start = Date.now();
  const assertions: DiagnosticAssertion[] = [];

  const highEriPosts = await prisma.post.findMany({
    where: {
      projectId,
      status: "PUBLISHED",
      analytics: { eri: { gte: ERI_THRESHOLD } },
    },
    include: {
      analytics: true,
      embedding: true,
    },
  });

  assertions.push({
    name: "high_eri_posts_tracked",
    passed: true,
    severity: "warning",
    message: `${highEriPosts.length} published post(s) with ERI ≥ ${ERI_THRESHOLD}`,
    meta: { count: highEriPosts.length, threshold: ERI_THRESHOLD },
  });

  if (highEriPosts.length === 0) {
    assertions.push({
      name: "reinforced_embeddings",
      passed: true,
      severity: "warning",
      message: "No high-ERI posts yet — vector reinforcement loop idle (expected early on)",
    });
  } else {
    const withoutEmbedding = highEriPosts.filter((p) => !p.embedding);
    assertions.push({
      name: "embeddings_generated",
      passed: withoutEmbedding.length === 0,
      severity: "error",
      message:
        withoutEmbedding.length === 0
          ? "All high-ERI posts have vector embeddings"
          : `${withoutEmbedding.length} high-ERI post(s) missing embeddings`,
      meta: { missing: withoutEmbedding.map((p) => p.id) },
    });

    const notReinforced = highEriPosts.filter(
      (p) => p.embedding && !p.embedding.reinforced
    );
    assertions.push({
      name: "reinforced_embeddings",
      passed: notReinforced.length === 0,
      severity: "error",
      message:
        notReinforced.length === 0
          ? "All high-ERI embeddings marked as reinforced"
          : `${notReinforced.length} high-ERI post(s) not yet reinforced`,
      meta: { pending: notReinforced.map((p) => p.id) },
    });

    const withEriScore = highEriPosts.filter(
      (p) => p.embedding?.eriScore != null && p.embedding.eriScore >= ERI_THRESHOLD
    );
    assertions.push({
      name: "eri_score_synced",
      passed: withEriScore.length === highEriPosts.length,
      severity: "warning",
      message:
        withEriScore.length === highEriPosts.length
          ? "Embedding ERI scores synced with analytics"
          : "Some embedding ERI scores out of sync with analytics",
    });
  }

  const snapshots = await prisma.eriSnapshot.count({ where: { projectId } });
  assertions.push({
    name: "eri_snapshots",
    passed: snapshots > 0,
    severity: "warning",
    message:
      snapshots > 0
        ? `${snapshots} ERI snapshot(s) recorded — feedback loop active`
        : "No ERI snapshots yet — run analytics cron to activate feedback loop",
    meta: { count: snapshots },
  });

  const score = computeSuiteScore(assertions);
  const status = deriveSuiteStatus(score, assertions);
  const passed = assertions.filter((a) => a.passed).length;

  return {
    suite: "feedback_loop",
    status,
    score,
    details: {
      assertions,
      summary: `${passed}/${assertions.length} checks passed — vector reinforcement ${status}`,
      durationMs: Date.now() - start,
    },
  };
}
