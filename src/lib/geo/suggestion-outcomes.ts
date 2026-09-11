import type { CitationModel, CitationRun } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bestMatchAgainstCitedUrls } from "@/lib/geo/normalize-published-url";

/** Successful post-publish runs before we label "not yet cited" (not failure). */
export const OUTCOME_AWAITING_RUN_THRESHOLD = 3;

/**
 * Minimum published suggestions that have completed the awaiting window
 * before we show the aggregate "earned citations" stat.
 */
export const OUTCOME_AGGREGATE_MIN_OBSERVED = 3;

export type SuggestionOutcomeStatus =
  | "needs_url"
  | "awaiting"
  | "cited_exact"
  | "cited_domain_only"
  | "not_yet_cited";

/**
 * After a successful CitationRun, check ACTIONED suggestions with a published
 * URL on the same TrackedQuery and record EXACT or DOMAIN outcomes.
 * Never invents matches; skips failed runs.
 */
export async function detectSuggestionOutcomesForRun(
  run: Pick<
    CitationRun,
    "id" | "trackedQueryId" | "model" | "citedUrls" | "error" | "runAt"
  >
): Promise<number> {
  if (run.error) return 0;
  if (!run.citedUrls || run.citedUrls.length === 0) return 0;

  const suggestions = await prisma.contentSuggestion.findMany({
    where: {
      trackedQueryId: run.trackedQueryId,
      status: "ACTIONED",
      publishedUrl: { not: null },
      publishedAt: { not: null, lte: run.runAt },
    },
    select: {
      id: true,
      publishedUrl: true,
    },
  });

  let written = 0;
  for (const suggestion of suggestions) {
    if (!suggestion.publishedUrl) continue;
    const matchType = bestMatchAgainstCitedUrls(
      suggestion.publishedUrl,
      run.citedUrls
    );
    if (!matchType) continue;

    try {
      await prisma.suggestionOutcome.create({
        data: {
          contentSuggestionId: suggestion.id,
          citationRunId: run.id,
          model: run.model,
          matchType,
          matchedAt: run.runAt,
        },
      });
      written += 1;
    } catch (err) {
      // Unique constraint = already recorded for this run/matchType.
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code !== "P2002") {
        console.error(
          `[suggestion-outcomes] write failed suggestion=${suggestion.id} run=${run.id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  return written;
}

export function deriveOutcomeStatus(input: {
  status: string;
  publishedUrl: string | null;
  publishedAt: Date | null;
  runsAfterPublish: number;
  exactCount: number;
  domainCount: number;
}): SuggestionOutcomeStatus {
  if (input.status !== "ACTIONED") {
    return "needs_url";
  }
  if (!input.publishedUrl || !input.publishedAt) {
    return "needs_url";
  }
  if (input.exactCount > 0) return "cited_exact";
  if (input.domainCount > 0) return "cited_domain_only";
  if (input.runsAfterPublish >= OUTCOME_AWAITING_RUN_THRESHOLD) {
    return "not_yet_cited";
  }
  return "awaiting";
}

export type OutcomeAggregate = {
  publishedWithUrl: number;
  observedEnoughRuns: number;
  earnedExactCitation: number;
  earnedDomainOnly: number;
  showAggregate: boolean;
};

export function buildOutcomeAggregate(
  rows: Array<{
    status: string;
    publishedUrl: string | null;
    runsAfterPublish: number;
    exactCount: number;
    domainCount: number;
  }>
): OutcomeAggregate {
  const published = rows.filter(
    (r) => r.status === "ACTIONED" && r.publishedUrl
  );
  const observedEnoughRuns = published.filter(
    (r) => r.runsAfterPublish >= OUTCOME_AWAITING_RUN_THRESHOLD
  ).length;
  const earnedExactCitation = published.filter((r) => r.exactCount > 0).length;
  const earnedDomainOnly = published.filter(
    (r) => r.exactCount === 0 && r.domainCount > 0
  ).length;

  return {
    publishedWithUrl: published.length,
    observedEnoughRuns,
    earnedExactCitation,
    earnedDomainOnly,
    showAggregate: observedEnoughRuns >= OUTCOME_AGGREGATE_MIN_OBSERVED,
  };
}

export type OutcomeRowDto = {
  id: string;
  matchType: "EXACT" | "DOMAIN";
  model: CitationModel;
  matchedAt: string;
  citationRunId: string;
};
