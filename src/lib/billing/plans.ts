import type { CitationModel } from "@prisma/client";

export type PlanTier = "FREE" | "STARTER" | "PRO";

/** Citation models available on a plan (enforced server-side in the runner). */
export type PlanCitationModel = CitationModel;

const ALL_CITATION_MODELS: PlanCitationModel[] = [
  "openai",
  "anthropic",
  "gemini",
  "perplexity",
  "grok",
];

/**
 * Phase 7 commercial limits — replaces Phase 3/4/6 placeholders.
 *
 * Cost note (from docs/deferred-work.md Phase 2/5 estimates, not live invoices):
 * - ~$0.04–0.12 per query per full 5-model sweep; sentiment ~$0.00005–0.0002/call
 * - FREE 5 prompts × 3 models × 1/week ≈ low single-digit $/user/month at list rates
 * - STARTER 15 × 5 × 1/week and PRO 25 × 5 × 2/week fit £15 / £39 if usage is not maxed
 * - No invoice-backed figures yet — re-check after first production billing week
 */
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    projects: number;
    postsPerMonth: number;
    trackedQueries: number;
    competitors: number;
    /** New generations + regenerations combined, UTC calendar month. */
    suggestionGenerationsPerMonth: number;
    /**
     * When true, suggestionGenerationsPerMonth is a fair-use soft cap:
     * generations still run, but the API returns a fair-use warning.
     */
    suggestionSoftCap: boolean;
    /** Models actually invoked for citation sweeps on this plan. */
    citationModels: PlanCitationModel[];
    /** Citation sweeps per week (Mon only = 1; Mon+Thu = 2). */
    runsPerWeek: 1 | 2;
  }
> = {
  FREE: {
    projects: 1,
    postsPerMonth: 8,
    trackedQueries: 5,
    competitors: 1,
    suggestionGenerationsPerMonth: 5,
    suggestionSoftCap: false,
    citationModels: ["openai", "perplexity", "gemini"],
    runsPerWeek: 1,
  },
  STARTER: {
    projects: 3,
    postsPerMonth: 40,
    trackedQueries: 15,
    competitors: 3,
    suggestionGenerationsPerMonth: 20,
    suggestionSoftCap: false,
    citationModels: [...ALL_CITATION_MODELS],
    runsPerWeek: 1,
  },
  PRO: {
    projects: 10,
    postsPerMonth: 200,
    trackedQueries: 25,
    competitors: 10,
    suggestionGenerationsPerMonth: 75,
    suggestionSoftCap: true,
    citationModels: [...ALL_CITATION_MODELS],
    runsPerWeek: 2,
  },
};

export const PLAN_DISPLAY: Record<
  PlanTier,
  { label: string; price: string; productIdEnvVar: string | null }
> = {
  FREE: { label: "Free", price: "£0", productIdEnvVar: null },
  STARTER: {
    label: "Starter",
    price: "£15/mo",
    productIdEnvVar: "DODO_STARTER_PRODUCT_ID",
  },
  PRO: {
    label: "Pro",
    price: "£39/mo",
    productIdEnvVar: "DODO_PRO_PRODUCT_ID",
  },
};

export const BILLING_UPGRADE_PATH = "/dashboard/billing";

export function productIdForTier(tier: PlanTier): string | null {
  const envVar = PLAN_DISPLAY[tier].productIdEnvVar;
  if (!envVar) return null;
  const value = process.env[envVar]?.trim();
  return value || null;
}

export function citationModelsForPlan(tier: PlanTier): PlanCitationModel[] {
  return PLAN_LIMITS[tier].citationModels;
}

/**
 * Whether a plan should run on this UTC weekday.
 * Cron is Mon+Thu 06:00 UTC; Free/Starter only run Mondays; Pro runs both.
 */
export function planRunsOnUtcWeekday(
  tier: PlanTier,
  utcDay: number = new Date().getUTCDay()
): boolean {
  const runs = PLAN_LIMITS[tier].runsPerWeek;
  const isMonday = utcDay === 1;
  const isThursday = utcDay === 4;
  if (runs >= 2) return isMonday || isThursday;
  return isMonday;
}
