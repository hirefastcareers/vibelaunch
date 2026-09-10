import {
  PLAN_DISPLAY,
  PLAN_LIMITS,
  type PlanCitationModel,
  type PlanTier,
} from "@/lib/billing/plans";

export const PLAN_TIERS: PlanTier[] = ["FREE", "STARTER", "PRO"];

export const CITATION_MODEL_LABELS: Record<PlanCitationModel, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
};

export function formatModelList(models: PlanCitationModel[]): string {
  return models.map((m) => CITATION_MODEL_LABELS[m]).join(", ");
}

export function formatRunsPerWeek(runs: 1 | 2): string {
  return runs >= 2 ? "2× / week (Mon + Thu)" : "1× / week (Monday)";
}

export function formatSuggestionsPerMonth(tier: PlanTier): string {
  const { suggestionGenerationsPerMonth, suggestionSoftCap } = PLAN_LIMITS[tier];
  const base = `${suggestionGenerationsPerMonth} / month`;
  return suggestionSoftCap ? `${base} (fair use)` : base;
}

export function formatPriceAmount(tier: PlanTier): string {
  // PLAN_DISPLAY.price is "£0" or "£15/mo" — split for table/card layout.
  return PLAN_DISPLAY[tier].price.replace(/\/mo$/, "");
}

export function formatPricePeriod(tier: PlanTier): string {
  return PLAN_DISPLAY[tier].price.includes("/mo") ? "/mo" : "";
}

export type MarketingPlanRow = {
  tier: PlanTier;
  label: string;
  price: string;
  priceAmount: string;
  pricePeriod: string;
  trackedQueries: number;
  models: string;
  modelCount: number;
  runsPerWeek: string;
  competitors: number;
  suggestions: string;
  featured: boolean;
};

export function marketingPlanRows(): MarketingPlanRow[] {
  return PLAN_TIERS.map((tier) => {
    const limits = PLAN_LIMITS[tier];
    const display = PLAN_DISPLAY[tier];
    return {
      tier,
      label: display.label,
      price: display.price,
      priceAmount: formatPriceAmount(tier),
      pricePeriod: formatPricePeriod(tier),
      trackedQueries: limits.trackedQueries,
      models: formatModelList(limits.citationModels),
      modelCount: limits.citationModels.length,
      runsPerWeek: formatRunsPerWeek(limits.runsPerWeek),
      competitors: limits.competitors,
      suggestions: formatSuggestionsPerMonth(tier),
      featured: tier === "STARTER",
    };
  });
}
