import { prisma } from "@/lib/prisma";
import {
  BILLING_UPGRADE_PATH,
  PLAN_LIMITS,
  type PlanTier,
} from "@/lib/billing/plans";

export class UsageLimitError extends Error {
  public readonly upgradePath = BILLING_UPGRADE_PATH;

  constructor(
    message: string,
    public code:
      | "PROJECT_LIMIT"
      | "POST_LIMIT"
      | "TRACKED_QUERY_LIMIT"
      | "COMPETITOR_LIMIT"
      | "SUGGESTION_LIMIT",
  ) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export interface UsageSnapshot {
  planTier: PlanTier;
  projectCount: number;
  postCount: number;
  trackedQueryCount: number;
  competitorCount: number;
  suggestionGenerationCount: number;
  projectLimit: number;
  postLimit: number;
  trackedQueryLimit: number;
  competitorLimit: number;
  suggestionGenerationsPerMonth: number;
  suggestionSoftCap: boolean;
  citationModels: string[];
  runsPerWeek: 1 | 2;
  publicScorecards: number;
}

function startOfUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function resolvePlanTier(userId: string): Promise<PlanTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true },
  });
  return user?.planTier ?? "FREE";
}

/** Count AI suggestion + gap-analysis generations this UTC month.
 *
 * Phase 11 shares the Phase 7 suggestion monthly quota (recommended):
 * each on-demand gap analysis that runs the LLM counts as one generation.
 * Cache hits do not count.
 */
export async function countSuggestionGenerationsThisMonth(
  userId: string,
  now = new Date()
): Promise<number> {
  const start = startOfUtcMonth(now);
  const [created, regenAgg, gapAnalyses] = await Promise.all([
    prisma.contentSuggestion.count({
      where: { userId, createdAt: { gte: start } },
    }),
    prisma.contentSuggestion.aggregate({
      where: {
        userId,
        regenerationWindowStart: { gte: start },
      },
      _sum: { regenerationCount: true },
    }),
    // updatedAt advances only when analysis is (re)generated, not on cache hits.
    prisma.citationGapAnalysis.count({
      where: { userId, updatedAt: { gte: start } },
    }),
  ]);
  return (
    created + (regenAgg._sum.regenerationCount ?? 0) + gapAnalyses
  );
}

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const planTier = await resolvePlanTier(userId);
  const limits = PLAN_LIMITS[planTier];
  const startOfMonth = startOfUtcMonth();

  const [
    projectCount,
    postCount,
    trackedQueryCount,
    competitorCount,
    suggestionGenerationCount,
  ] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.post.count({
      where: {
        project: { userId },
        status: { not: "DRAFT" },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.trackedQuery.count({ where: { userId } }),
    prisma.competitorBrand.count({ where: { userId } }),
    countSuggestionGenerationsThisMonth(userId),
  ]);

  return {
    planTier,
    projectCount,
    postCount,
    trackedQueryCount,
    competitorCount,
    suggestionGenerationCount,
    projectLimit: limits.projects,
    postLimit: limits.postsPerMonth,
    trackedQueryLimit: limits.trackedQueries,
    competitorLimit: limits.competitors,
    suggestionGenerationsPerMonth: limits.suggestionGenerationsPerMonth,
    suggestionSoftCap: limits.suggestionSoftCap,
    citationModels: [...limits.citationModels],
    runsPerWeek: limits.runsPerWeek,
    publicScorecards: limits.publicScorecards,
  };
}

function upgradeMessage(detail: string): string {
  return `${detail} Upgrade at ${BILLING_UPGRADE_PATH}.`;
}

export async function assertCanCreateProject(userId: string): Promise<void> {
  const usage = await getUsage(userId);
  if (usage.projectCount >= usage.projectLimit) {
    throw new UsageLimitError(
      upgradeMessage(
        `Project limit reached for the ${usage.planTier} plan (${usage.projectLimit} max).`
      ),
      "PROJECT_LIMIT"
    );
  }
}

export async function assertCanCreatePost(userId: string): Promise<void> {
  const usage = await getUsage(userId);
  if (usage.postCount >= usage.postLimit) {
    throw new UsageLimitError(
      upgradeMessage(
        `Post limit reached for the ${usage.planTier} plan this month (${usage.postLimit} max).`
      ),
      "POST_LIMIT"
    );
  }
}

export async function assertCanCreateTrackedQueries(
  userId: string,
  additional = 1
): Promise<void> {
  if (additional < 1) return;
  const usage = await getUsage(userId);
  if (usage.trackedQueryCount + additional > usage.trackedQueryLimit) {
    throw new UsageLimitError(
      upgradeMessage(
        `Tracked prompt limit reached for the ${usage.planTier} plan (${usage.trackedQueryLimit} max).`
      ),
      "TRACKED_QUERY_LIMIT"
    );
  }
}

export async function assertCanCreateCompetitors(
  userId: string,
  additional = 1
): Promise<void> {
  if (additional < 1) return;
  const usage = await getUsage(userId);
  if (usage.competitorCount + additional > usage.competitorLimit) {
    throw new UsageLimitError(
      upgradeMessage(
        `Competitor limit reached for the ${usage.planTier} plan (${usage.competitorLimit} max).`
      ),
      "COMPETITOR_LIMIT"
    );
  }
}

export type SuggestionGenerationGate = {
  /** Hard-blocked (Free/Starter over cap). */
  blocked: boolean;
  /** Soft-cap fair-use warning (Pro over 75/mo). */
  softWarned: boolean;
  used: number;
  limit: number;
  planTier: PlanTier;
  /**
   * For regenerations: UTC-month window + per-row count to persist.
   * New creates ignore this.
   */
  regeneration: { count: number; windowStart: Date };
};

/**
 * Gate a content-suggestion create or regenerate against the monthly quota.
 * Free/Starter: hard block at the cap.
 * Pro: soft cap — allow with fair-use warning (no silent overage).
 */
export async function gateSuggestionGeneration(
  userId: string,
  suggestion?: {
    regenerationCount: number;
    regenerationWindowStart: Date | null;
  },
  now = new Date()
): Promise<SuggestionGenerationGate> {
  const usage = await getUsage(userId);
  const windowStart = startOfUtcMonth(now);
  const inWindow =
    suggestion?.regenerationWindowStart != null &&
    suggestion.regenerationWindowStart.getTime() >= windowStart.getTime();
  const rowCount = suggestion
    ? inWindow
      ? suggestion.regenerationCount
      : 0
    : 0;

  const used = usage.suggestionGenerationCount;
  const limit = usage.suggestionGenerationsPerMonth;
  const over = used >= limit;

  if (over && !usage.suggestionSoftCap) {
    throw new UsageLimitError(
      upgradeMessage(
        `Content suggestion limit reached for the ${usage.planTier} plan (${limit}/month).`
      ),
      "SUGGESTION_LIMIT"
    );
  }

  return {
    blocked: false,
    softWarned: over && usage.suggestionSoftCap,
    used,
    limit,
    planTier: usage.planTier,
    regeneration: { count: rowCount, windowStart },
  };
}

/** @deprecated Use gateSuggestionGeneration — kept as a thin alias for regen call sites. */
export async function assertCanRegenerateSuggestion(
  userId: string,
  suggestion: {
    regenerationCount: number;
    regenerationWindowStart: Date | null;
  },
  now = new Date()
): Promise<{ count: number; windowStart: Date; softWarned: boolean }> {
  const gate = await gateSuggestionGeneration(userId, suggestion, now);
  return {
    count: gate.regeneration.count,
    windowStart: gate.regeneration.windowStart,
    softWarned: gate.softWarned,
  };
}
