import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public code:
      | "PROJECT_LIMIT"
      | "POST_LIMIT"
      | "TRACKED_QUERY_LIMIT"
      | "COMPETITOR_LIMIT"
      | "SUGGESTION_REGEN_LIMIT",
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
  projectLimit: number;
  postLimit: number;
  trackedQueryLimit: number;
  competitorLimit: number;
  suggestionRegensPerDay: number;
}

function startOfUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function resolvePlanTier(userId: string): Promise<PlanTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true },
  });
  return user?.planTier ?? "FREE";
}

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const planTier = await resolvePlanTier(userId);
  const limits = PLAN_LIMITS[planTier];
  const startOfMonth = startOfUtcMonth();

  const [projectCount, postCount, trackedQueryCount, competitorCount] =
    await Promise.all([
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
    ]);

  return {
    planTier,
    projectCount,
    postCount,
    trackedQueryCount,
    competitorCount,
    projectLimit: limits.projects,
    postLimit: limits.postsPerMonth,
    trackedQueryLimit: limits.trackedQueries,
    competitorLimit: limits.competitors,
    suggestionRegensPerDay: limits.suggestionRegensPerDay,
  };
}

export async function assertCanCreateProject(userId: string): Promise<void> {
  const usage = await getUsage(userId);
  if (usage.projectCount >= usage.projectLimit) {
    throw new UsageLimitError(
      `Project limit reached for the ${usage.planTier} plan`,
      "PROJECT_LIMIT",
    );
  }
}

export async function assertCanCreatePost(userId: string): Promise<void> {
  const usage = await getUsage(userId);
  if (usage.postCount >= usage.postLimit) {
    throw new UsageLimitError(
      `Post limit reached for the ${usage.planTier} plan this month`,
      "POST_LIMIT",
    );
  }
}

/**
 * Ensure adding `additional` tracked queries would not exceed the plan cap.
 * Placeholder caps — see docs/deferred-work.md (Phase 7).
 */
export async function assertCanCreateTrackedQueries(
  userId: string,
  additional = 1,
): Promise<void> {
  if (additional < 1) return;
  const usage = await getUsage(userId);
  if (usage.trackedQueryCount + additional > usage.trackedQueryLimit) {
    throw new UsageLimitError(
      `Tracked query limit reached for the ${usage.planTier} plan (${usage.trackedQueryLimit} max). Upgrade or delete unused prompts.`,
      "TRACKED_QUERY_LIMIT",
    );
  }
}

/**
 * Ensure adding `additional` competitor brands would not exceed the plan cap.
 * Placeholder caps — see docs/deferred-work.md (Phase 7).
 */
export async function assertCanCreateCompetitors(
  userId: string,
  additional = 1,
): Promise<void> {
  if (additional < 1) return;
  const usage = await getUsage(userId);
  if (usage.competitorCount + additional > usage.competitorLimit) {
    throw new UsageLimitError(
      `Competitor limit reached for the ${usage.planTier} plan (${usage.competitorLimit} max). Upgrade or remove a competitor.`,
      "COMPETITOR_LIMIT",
    );
  }
}

/**
 * Ensure a ContentSuggestion can be regenerated under the daily placeholder cap.
 * Window is UTC day; count lives on the suggestion row.
 */
export async function assertCanRegenerateSuggestion(
  userId: string,
  suggestion: {
    regenerationCount: number;
    regenerationWindowStart: Date | null;
  },
  now = new Date(),
): Promise<{ count: number; windowStart: Date }> {
  const usage = await getUsage(userId);
  const windowStart = startOfUtcDay(now);
  const inWindow =
    suggestion.regenerationWindowStart != null &&
    suggestion.regenerationWindowStart.getTime() >= windowStart.getTime();
  const count = inWindow ? suggestion.regenerationCount : 0;

  if (count >= usage.suggestionRegensPerDay) {
    throw new UsageLimitError(
      `Suggestion regeneration limit reached (${usage.suggestionRegensPerDay}/day on ${usage.planTier}). Try again tomorrow.`,
      "SUGGESTION_REGEN_LIMIT",
    );
  }

  return { count, windowStart };
}

function startOfUtcDay(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}
