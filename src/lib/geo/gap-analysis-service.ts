import type { CitationModel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CITATION_MODEL_LABELS } from "@/lib/geo/citation-analytics";
import {
  collectPageEvidence,
  GapAnalysisError,
  generateGapAnalysisText,
  summarizeMissedQueryDomains,
} from "@/lib/geo/gap-analysis";
import type { DomainTally } from "@/lib/geo/normalize-citation-domain";
import type { PageFetchResult } from "@/lib/geo/fetch-page-for-analysis";

function startOfUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type GapAnalysisDto = {
  id: string;
  trackedQueryId: string;
  topDomains: DomainTally[];
  analysisText: string;
  fetchNotes: PageFetchResult[];
  domainsFingerprint: string;
  cached: boolean;
  createdAt: string;
  updatedAt: string;
  missedRunCount: number;
};

function asDomainTallies(value: unknown): DomainTally[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is DomainTally => {
    return (
      row != null &&
      typeof row === "object" &&
      typeof (row as DomainTally).domain === "string" &&
      typeof (row as DomainTally).count === "number"
    );
  });
}

function asFetchNotes(value: unknown): PageFetchResult[] {
  if (!Array.isArray(value)) return [];
  return value as PageFetchResult[];
}

export async function getCachedGapAnalysis(
  trackedQueryId: string,
  userId: string,
  currentFingerprint: string
): Promise<GapAnalysisDto | null> {
  const row = await prisma.citationGapAnalysis.findFirst({
    where: { trackedQueryId, userId },
  });
  if (!row) return null;
  if (row.domainsFingerprint !== currentFingerprint) return null;

  return {
    id: row.id,
    trackedQueryId: row.trackedQueryId,
    topDomains: asDomainTallies(row.topDomains),
    analysisText: row.analysisText,
    fetchNotes: asFetchNotes(row.fetchNotes),
    domainsFingerprint: row.domainsFingerprint,
    cached: true,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    missedRunCount: 0,
  };
}

/**
 * Return cached analysis when fingerprint matches, otherwise generate.
 * LLM + page fetches only run on cache miss or force=true.
 */
export async function getOrCreateGapAnalysis(opts: {
  trackedQueryId: string;
  userId: string;
  force?: boolean;
  model?: CitationModel;
}): Promise<GapAnalysisDto> {
  const summary = await summarizeMissedQueryDomains(
    opts.trackedQueryId,
    opts.userId,
    { model: opts.model }
  );
  if (!summary) {
    throw new GapAnalysisError("Tracked query not found");
  }

  if (summary.missedRunCount === 0) {
    throw new GapAnalysisError(
      "No successful missed runs with citations yet for this query — nothing to analyse"
    );
  }

  if (!opts.force) {
    const cached = await getCachedGapAnalysis(
      opts.trackedQueryId,
      opts.userId,
      summary.domainsFingerprint
    );
    if (cached) {
      return { ...cached, missedRunCount: summary.missedRunCount };
    }
  }

  const pageFetches = await collectPageEvidence(summary.sampleUrlsForFetch);
  const focusModelLabel = opts.model
    ? CITATION_MODEL_LABELS[opts.model]
    : undefined;

  const { analysisText } = await generateGapAnalysisText({
    brandName: summary.brandName,
    promptText: summary.promptText,
    topDomains: summary.topDomains,
    pageFetches,
    focusModelLabel,
  });

  const windowStart = startOfUtcMonth();
  const existing = await prisma.citationGapAnalysis.findUnique({
    where: { trackedQueryId: opts.trackedQueryId },
    select: { generationCount: true, generationWindowStart: true },
  });
  const inWindow =
    existing?.generationWindowStart != null &&
    existing.generationWindowStart.getTime() >= windowStart.getTime();
  const nextGenerationCount = inWindow ? existing!.generationCount + 1 : 1;

  const row = await prisma.citationGapAnalysis.upsert({
    where: { trackedQueryId: opts.trackedQueryId },
    create: {
      userId: opts.userId,
      trackedQueryId: opts.trackedQueryId,
      topDomains: summary.topDomains,
      domainsFingerprint: summary.domainsFingerprint,
      analysisText,
      fetchNotes: pageFetches,
      generationCount: 1,
      generationWindowStart: windowStart,
    },
    update: {
      topDomains: summary.topDomains,
      domainsFingerprint: summary.domainsFingerprint,
      analysisText,
      fetchNotes: pageFetches,
      generationCount: nextGenerationCount,
      generationWindowStart: windowStart,
    },
  });

  return {
    id: row.id,
    trackedQueryId: row.trackedQueryId,
    topDomains: summary.topDomains,
    analysisText: row.analysisText,
    fetchNotes: pageFetches,
    domainsFingerprint: row.domainsFingerprint,
    cached: false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    missedRunCount: summary.missedRunCount,
  };
}

export async function previewMissedDomains(
  trackedQueryId: string,
  userId: string,
  model?: CitationModel
) {
  return summarizeMissedQueryDomains(trackedQueryId, userId, { model });
}
