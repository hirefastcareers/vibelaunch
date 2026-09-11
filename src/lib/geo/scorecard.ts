import type { CitationModel, CitationSentiment } from "@prisma/client";
import { detectBrandMention } from "@/lib/geo/brand-mention";
import {
  CITATION_MODEL_LABELS,
  CITATION_MODELS,
} from "@/lib/geo/citation-analytics";
import { prisma } from "@/lib/prisma";

/**
 * Minimum successful CitationRun rows before we publish a numeric score.
 * Below this we still render the page (if opted in) but refuse a confident number.
 */
export const SCORECARD_MIN_SUCCESSFUL_RUNS = 10;

/** At least this many models must have ≥1 successful run. */
export const SCORECARD_MIN_MODELS_WITH_DATA = 2;

export const SCORECARD_METHODOLOGY_SHORT =
  "Equal-weight average of per-model mention rates on successful runs. Models with no successful runs are excluded. Failed API calls do not count.";

export type ScorecardModelRow = {
  model: CitationModel;
  label: string;
  mentionRate: number | null;
  mentioned: number;
  total: number;
};

export type ScorecardSentiment = {
  positive: number;
  neutral: number;
  negative: number;
  unclassified: number;
};

/** Named competitor rows — private dashboard / Compare only. Not on public scorecards. */
export type ScorecardCompetitorRow = {
  brandName: string;
  mentionRate: number;
  mentioned: number;
  total: number;
  rank: number;
};

/**
 * Public anonymized rank among the user's brand + their tracked competitors.
 * Never includes other brand names.
 */
export type ScorecardAnonymousRank = {
  /** 1-based rank of the scorecard brand within the tracked set. */
  yourRank: number | null;
  /** Brands in the comparison (= 1 + tracked competitors). */
  brandCount: number;
  /** e.g. "ranked #2 of 4 tracked brands" */
  label: string;
};

export type PublicScorecardPayload = {
  brandName: string;
  /** null when insufficient data — never invent a score. */
  score: number | null;
  sufficientData: boolean;
  insufficientReason: string | null;
  methodology: string;
  methodologyDetail: string[];
  models: ScorecardModelRow[];
  sentiment: ScorecardSentiment;
  /**
   * Anonymized rank vs the user's tracked competitor set.
   * Competitor names are never included on the public payload.
   */
  anonymousRank: ScorecardAnonymousRank;
  successfulRuns: number;
  modelsWithData: number;
  generatedAt: string;
};

function rate(mentioned: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((mentioned / total) * 100);
}

/**
 * Headline score (0–100): mean of per-model mention rates for models that have
 * at least one successful run. Equal weight per model (not per run).
 */
export function computeVisibilityScore(
  models: Array<{ mentionRate: number | null; total: number }>
): number | null {
  const withData = models.filter((m) => m.total > 0 && m.mentionRate != null);
  if (withData.length === 0) return null;
  const sum = withData.reduce((acc, m) => acc + (m.mentionRate as number), 0);
  return Math.round(sum / withData.length);
}

export function scorecardDataIsSufficient(input: {
  successfulRuns: number;
  modelsWithData: number;
}): { ok: boolean; reason: string | null } {
  if (input.successfulRuns < SCORECARD_MIN_SUCCESSFUL_RUNS) {
    return {
      ok: false,
      reason: `Need at least ${SCORECARD_MIN_SUCCESSFUL_RUNS} successful citation runs (have ${input.successfulRuns}).`,
    };
  }
  if (input.modelsWithData < SCORECARD_MIN_MODELS_WITH_DATA) {
    return {
      ok: false,
      reason: `Need successful runs on at least ${SCORECARD_MIN_MODELS_WITH_DATA} models (have ${input.modelsWithData}).`,
    };
  }
  return { ok: true, reason: null };
}

function tallySentiment(
  values: Array<CitationSentiment | null | undefined>
): ScorecardSentiment {
  const counts: ScorecardSentiment = {
    positive: 0,
    neutral: 0,
    negative: 0,
    unclassified: 0,
  };
  for (const value of values) {
    if (value === "positive") counts.positive += 1;
    else if (value === "neutral") counts.neutral += 1;
    else if (value === "negative") counts.negative += 1;
    else counts.unclassified += 1;
  }
  return counts;
}

/**
 * Build the public (privacy-safe) scorecard payload for a user.
 * Never includes prompts, raw responses, cited URL lists, or account fields.
 */
export async function buildScorecardPayload(
  userId: string
): Promise<PublicScorecardPayload> {
  const [trackedQueries, competitors] = await Promise.all([
    prisma.trackedQuery.findMany({
      where: { userId },
      select: {
        brandName: true,
        runs: {
          select: {
            model: true,
            brandMentioned: true,
            sentiment: true,
            error: true,
            rawResponse: true,
          },
          orderBy: { runAt: "desc" },
          take: 500,
        },
      },
    }),
    prisma.competitorBrand.findMany({
      where: { userId },
      select: { brandName: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const brandName = trackedQueries[0]?.brandName?.trim() || "Unknown brand";
  const allRuns = trackedQueries.flatMap((q) => q.runs);
  const successful = allRuns.filter((run) => !run.error);

  const models: ScorecardModelRow[] = CITATION_MODELS.map((model) => {
    const modelRuns = successful.filter((run) => run.model === model);
    const mentioned = modelRuns.filter((run) => run.brandMentioned).length;
    const total = modelRuns.length;
    return {
      model,
      label: CITATION_MODEL_LABELS[model],
      mentionRate: total === 0 ? null : rate(mentioned, total),
      mentioned,
      total,
    };
  });

  const modelsWithData = models.filter((m) => m.total > 0).length;
  const sufficiency = scorecardDataIsSufficient({
    successfulRuns: successful.length,
    modelsWithData,
  });

  const score = sufficiency.ok ? computeVisibilityScore(models) : null;
  const mentionedRuns = successful.filter((run) => run.brandMentioned);
  const sentiment = tallySentiment(mentionedRuns.map((r) => r.sentiment));

  const rankingCandidates: Array<{
    brandName: string;
    mentioned: number;
    total: number;
  }> = [
    {
      brandName,
      mentioned: mentionedRuns.length,
      total: successful.length,
    },
  ];

  for (const competitor of competitors) {
    let mentioned = 0;
    for (const run of successful) {
      if (detectBrandMention(run.rawResponse, competitor.brandName)) {
        mentioned += 1;
      }
    }
    rankingCandidates.push({
      brandName: competitor.brandName,
      mentioned,
      total: successful.length,
    });
  }

  const ranked = rankingCandidates
    .map((row) => ({
      brandName: row.brandName,
      mentioned: row.mentioned,
      total: row.total,
      mentionRate: rate(row.mentioned, row.total),
    }))
    .sort((a, b) => b.mentionRate - a.mentionRate || b.mentioned - a.mentioned);

  const yourIndex = ranked.findIndex((row) => row.brandName === brandName);
  const brandCount = ranked.length;
  const yourRank = yourIndex >= 0 ? yourIndex + 1 : null;
  const anonymousRank: ScorecardAnonymousRank = {
    yourRank,
    brandCount,
    label:
      yourRank == null
        ? "Rank unavailable"
        : brandCount <= 1
          ? "Ranked #1 of 1 tracked brand (no competitors tracked)"
          : `Ranked #${yourRank} of ${brandCount} tracked brands`,
  };

  return {
    brandName,
    score,
    sufficientData: sufficiency.ok,
    insufficientReason: sufficiency.reason,
    methodology: SCORECARD_METHODOLOGY_SHORT,
    methodologyDetail: [
      "Successful CitationRun rows only (error runs excluded).",
      "Per-model mention rate = brand mentions ÷ successful runs for that model.",
      "Headline score = round(average of per-model rates for models with ≥1 successful run).",
      `Numeric score is withheld until ≥${SCORECARD_MIN_SUCCESSFUL_RUNS} successful runs across ≥${SCORECARD_MIN_MODELS_WITH_DATA} models.`,
      "Sentiment counts only runs where the brand was mentioned; unclassified stays unclassified.",
      "Public pages show only your anonymized rank among tracked brands — competitor names stay private (dashboard Compare still shows names).",
    ],
    models,
    sentiment,
    anonymousRank,
    successfulRuns: successful.length,
    modelsWithData,
    generatedAt: new Date().toISOString(),
  };
}

export function slugifyBrand(brandName: string): string {
  const base = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || "brand";
}

export function generateScorecardSlug(brandName: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugifyBrand(brandName)}-${suffix}`;
}

/** Load a public scorecard by slug. Returns null when missing or unpublished (caller should 404). */
export async function getPublicScorecardBySlug(
  slug: string
): Promise<PublicScorecardPayload | null> {
  const user = await prisma.user.findFirst({
    where: {
      scorecardSlug: slug,
      scorecardPublic: true,
    },
    select: { id: true },
  });
  if (!user) return null;
  return buildScorecardPayload(user.id);
}
