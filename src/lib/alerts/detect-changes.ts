import type {
  AlertType,
  CitationModel,
  CitationSentiment,
} from "@prisma/client";

export type ObservedChange = {
  type: AlertType;
  fingerprint: string;
  detail: Record<string, unknown>;
};

export type RunSnapshot = {
  id: string;
  model: CitationModel;
  brandMentioned: boolean;
  sentiment: CitationSentiment | null;
  competitorMentions: Array<{
    competitorBrandId: string;
    competitorBrandName: string;
    mentioned: boolean;
  }>;
};

/**
 * Diff two successful runs for the same TrackedQuery + model.
 * Does not emit alerts — callers confirm across 2 consecutive observations.
 */
export function detectRunChanges(
  previous: RunSnapshot,
  current: RunSnapshot,
  context: { brandName: string; promptText: string }
): ObservedChange[] {
  if (previous.model !== current.model) return [];

  const changes: ObservedChange[] = [];
  const base = {
    model: current.model,
    brandName: context.brandName,
    promptText: context.promptText,
    previousRunId: previous.id,
    currentRunId: current.id,
  };

  if (previous.brandMentioned && !current.brandMentioned) {
    changes.push({
      type: "CITATION_LOST",
      fingerprint: `CITATION_LOST:${current.model}`,
      detail: { ...base, previousMentioned: true, currentMentioned: false },
    });
  }

  if (!previous.brandMentioned && current.brandMentioned) {
    changes.push({
      type: "CITATION_GAINED",
      fingerprint: `CITATION_GAINED:${current.model}`,
      detail: { ...base, previousMentioned: false, currentMentioned: true },
    });
  }

  if (
    previous.brandMentioned &&
    current.brandMentioned &&
    previous.sentiment === "positive" &&
    current.sentiment === "negative"
  ) {
    changes.push({
      type: "SENTIMENT_FLIP",
      fingerprint: `SENTIMENT_FLIP:${current.model}`,
      detail: {
        ...base,
        previousSentiment: previous.sentiment,
        currentSentiment: current.sentiment,
      },
    });
  }

  // Competitor overtake: competitor mentioned while brand is not,
  // and previously brand was mentioned or competitor was not.
  const prevComp = new Map(
    previous.competitorMentions.map((c) => [c.competitorBrandId, c])
  );
  for (const curr of current.competitorMentions) {
    if (!curr.mentioned) continue;
    if (current.brandMentioned) continue;
    const prev = prevComp.get(curr.competitorBrandId);
    const prevMentioned = prev?.mentioned === true;
    const brandWasAhead = previous.brandMentioned || !prevMentioned;
    if (!brandWasAhead) continue;

    changes.push({
      type: "COMPETITOR_OVERTAKE",
      fingerprint: `COMPETITOR_OVERTAKE:${current.model}:${curr.competitorBrandId}`,
      detail: {
        ...base,
        competitorBrandId: curr.competitorBrandId,
        competitorBrandName: curr.competitorBrandName,
        previousBrandMentioned: previous.brandMentioned,
        previousCompetitorMentioned: prevMentioned,
        currentBrandMentioned: current.brandMentioned,
        currentCompetitorMentioned: true,
      },
    });
  }

  return changes;
}

/** Consecutive matching observations required before creating an Alert. */
export const ALERT_CONFIRMATION_RUNS = 2;
