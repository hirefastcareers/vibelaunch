export type PlanTier = "FREE" | "STARTER" | "PRO";

/**
 * Placeholder tracked-query + competitor caps pending Phase 7 pricing decisions.
 * Logged in docs/deferred-work.md — do not treat as final commercial limits.
 */
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    projects: number;
    postsPerMonth: number;
    trackedQueries: number;
    competitors: number;
    /** Max regenerations per ContentSuggestion per UTC day (placeholder). */
    suggestionRegensPerDay: number;
  }
> = {
  FREE: {
    projects: 1,
    postsPerMonth: 8,
    trackedQueries: 10,
    competitors: 1,
    suggestionRegensPerDay: 3,
  },
  STARTER: {
    projects: 3,
    postsPerMonth: 40,
    trackedQueries: 25,
    competitors: 3,
    suggestionRegensPerDay: 3,
  },
  PRO: {
    projects: 10,
    postsPerMonth: 200,
    trackedQueries: 50,
    competitors: 10,
    suggestionRegensPerDay: 3,
  },
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
