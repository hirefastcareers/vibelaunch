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
import {
  citationModelsForPlan,
  planRunsOnUtcWeekday,
} from "@/lib/billing/plans";
import { resolvePlanTier } from "@/lib/billing/limits";

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

/**
 * Run plan-allowed providers for a single tracked query.
 * Free tier never calls anthropic/grok — enforced here, not only in the UI.
 */
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

  const planTier = await resolvePlanTier(trackedQuery.userId);
  const allowed = new Set<string>(citationModelsForPlan(planTier));
  const providers = CITATION_PROVIDERS.filter((p) => allowed.has(p));

  if (providers.length === 0) {
    console.warn(
      `[citation-run] no providers allowed for plan=${planTier} query=${trackedQueryId}`
    );
    return [];
  }

  console.info(
    `[citation-run] query=${trackedQueryId} plan=${planTier} models=${providers.join(",")}`
  );

  const outcomes: CitationRunOutcome[] = [];
  for (const provider of providers) {
    outcomes.push(await executeCitationRun(trackedQuery, provider));
  }
  return outcomes;
}

/**
 * Active queries whose owner plan is due to run on this UTC weekday.
 * Free/Starter: Mondays only. Pro: Mondays + Thursdays.
 */
export async function listActiveTrackedQueryIdsDueToday(
  now = new Date()
): Promise<string[]> {
  const rows = await prisma.trackedQuery.findMany({
    where: { active: true },
    select: {
      id: true,
      user: { select: { planTier: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows
    .filter((row) =>
      planRunsOnUtcWeekday(row.user.planTier ?? "FREE", now.getUTCDay())
    )
    .map((row) => row.id);
}

/** @deprecated Prefer listActiveTrackedQueryIdsDueToday for cron fan-out. */
export async function listActiveTrackedQueryIds(): Promise<string[]> {
  return listActiveTrackedQueryIdsDueToday();
}
