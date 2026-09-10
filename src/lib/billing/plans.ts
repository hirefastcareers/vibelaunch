export type PlanTier = "FREE" | "STARTER" | "PRO";

/**
 * Placeholder tracked-query caps pending Phase 7 pricing decisions.
 * Logged in docs/deferred-work.md — do not treat as final commercial limits.
 */
export const PLAN_LIMITS: Record<
  PlanTier,
  { projects: number; postsPerMonth: number; trackedQueries: number }
> = {
  FREE: { projects: 1, postsPerMonth: 8, trackedQueries: 10 },
  STARTER: { projects: 3, postsPerMonth: 40, trackedQueries: 25 },
  PRO: { projects: 10, postsPerMonth: 200, trackedQueries: 50 },
};

export const PLAN_DISPLAY: Record<
  PlanTier,
  { label: string; price: string; productIdEnvVar: string | null }
> = {
  FREE: { label: "Free", price: "$0", productIdEnvVar: null },
  STARTER: { label: "Starter", price: "$19/mo", productIdEnvVar: "DODO_STARTER_PRODUCT_ID" },
  PRO: { label: "Pro", price: "$49/mo", productIdEnvVar: "DODO_PRO_PRODUCT_ID" },
};

export function productIdForTier(tier: PlanTier): string | null {
  const envVar = PLAN_DISPLAY[tier].productIdEnvVar;
  if (!envVar) return null;
  const value = process.env[envVar]?.trim();
  return value || null;
}
