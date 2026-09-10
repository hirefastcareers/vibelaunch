import type { CitationModel, CitationRun, TrackedQuery } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectBrandMention } from "@/lib/geo/brand-mention";
import {
  CITATION_PROVIDERS,
  ModelRunnerError,
  runCitationModel,
  type CitationProvider,
} from "@/lib/geo/model-runners";
import { attachSentimentsForRun } from "@/lib/geo/attach-sentiments";

export type CitationRunOutcome = {
  model: CitationProvider;
  run: CitationRun;
  ok: boolean;
};

const PROVIDER_TO_MODEL: Record<CitationProvider, CitationModel> = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
  perplexity: "perplexity",
  grok: "grok",
};

/**
 * Run one TrackedQuery against one provider and persist a CitationRun.
 * Failures are logged and stored with error + brandMentioned=false (never faked).
 */
export async function executeCitationRun(
  trackedQuery: Pick<TrackedQuery, "id" | "userId" | "brandName" | "promptText">,
  provider: CitationProvider
): Promise<CitationRunOutcome> {
  const model = PROVIDER_TO_MODEL[provider];

  try {
    const result = await runCitationModel(provider, trackedQuery.promptText);
    const brandMentioned = detectBrandMention(
      result.rawResponse,
      trackedQuery.brandName
    );

    const run = await prisma.citationRun.create({
      data: {
        trackedQueryId: trackedQuery.id,
        model,
        rawResponse: result.rawResponse,
        brandMentioned,
        citedUrls: result.citedUrls,
        sentiment: null,
        error: null,
      },
    });

    // Phase 5: classify brand + competitor mention sentiment (null on failure).
    const { brandSentiment } = await attachSentimentsForRun(run, {
      userId: trackedQuery.userId,
      brandName: trackedQuery.brandName,
    });
    if (brandSentiment) {
      run.sentiment = brandSentiment;
    }

    return { model: provider, run, ok: true };
  } catch (err) {
    const message =
      err instanceof ModelRunnerError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);

    console.error(
      `[citation-run] trackedQuery=${trackedQuery.id} model=${provider} failed:`,
      message
    );

    const run = await prisma.citationRun.create({
      data: {
        trackedQueryId: trackedQuery.id,
        model,
        rawResponse: "",
        brandMentioned: false,
        citedUrls: [],
        sentiment: null,
        error: message.slice(0, 1000),
      },
    });

    return { model: provider, run, ok: false };
  }
}

/** Run all five providers for a single tracked query. */
export async function executeCitationSweepForQuery(
  trackedQueryId: string
): Promise<CitationRunOutcome[]> {
  const trackedQuery = await prisma.trackedQuery.findUnique({
    where: { id: trackedQueryId },
  });
  if (!trackedQuery) {
    throw new Error(`TrackedQuery not found: ${trackedQueryId}`);
  }
  if (!trackedQuery.active) {
    console.info(`[citation-run] skip inactive query ${trackedQueryId}`);
    return [];
  }

  const outcomes: CitationRunOutcome[] = [];
  for (const provider of CITATION_PROVIDERS) {
    outcomes.push(await executeCitationRun(trackedQuery, provider));
  }
  return outcomes;
}

/**
 * Fan-out entry used by cron: return active query ids for enqueue / inline run.
 */
export async function listActiveTrackedQueryIds(): Promise<string[]> {
  const rows = await prisma.trackedQuery.findMany({
    where: { active: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.id);
}
