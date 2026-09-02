export type PlanTier = "FREE" | "STARTER" | "PRO";

export const PLAN_LIMITS: Record<PlanTier, { projects: number; postsPerMonth: number }> = {
  FREE: { projects: 1, postsPerMonth: 8 },
  STARTER: { projects: 3, postsPerMonth: 40 },
  PRO: { projects: 10, postsPerMonth: 200 },
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
