import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public code: "PROJECT_LIMIT" | "POST_LIMIT",
  ) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export interface UsageSnapshot {
  planTier: PlanTier;
  projectCount: number;
  postCount: number;
  projectLimit: number;
  postLimit: number;
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

  const [projectCount, postCount] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.post.count({
      where: {
        project: { userId },
        status: { not: "DRAFT" },
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    planTier,
    projectCount,
    postCount,
    projectLimit: limits.projects,
    postLimit: limits.postsPerMonth,
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
