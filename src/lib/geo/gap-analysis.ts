import type { CitationModel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  aggregateCitedDomains,
  domainsFingerprint,
  type DomainTally,
} from "@/lib/geo/normalize-citation-domain";
import {
  fetchTopPagesForAnalysis,
  type PageFetchResult,
} from "@/lib/geo/fetch-page-for-analysis";

export type MissedQueryDomainSummary = {
  trackedQueryId: string;
  brandName: string;
  promptText: string;
  missedRunCount: number;
  topDomains: DomainTally[];
  domainsFingerprint: string;
  sampleUrlsForFetch: string[];
};

/**
 * Aggregate citedUrls from successful CitationRuns where the brand was NOT mentioned.
 * Reads stored Phase 2 data only — no new provider citation API calls.
 */
export async function summarizeMissedQueryDomains(
  trackedQueryId: string,
  userId: string,
  options?: { model?: CitationModel; topN?: number }
): Promise<MissedQueryDomainSummary | null> {
  const topN = options?.topN ?? 8;
  const query = await prisma.trackedQuery.findFirst({
    where: { id: trackedQueryId, userId },
    select: {
      id: true,
      brandName: true,
      promptText: true,
      runs: {
        where: {
          error: null,
          brandMentioned: false,
          ...(options?.model ? { model: options.model } : {}),
        },
        orderBy: { runAt: "desc" },
        take: 40,
        select: { citedUrls: true, model: true },
      },
    },
  });

  if (!query) return null;

  const entries: Array<{ url: string; model: string }> = [];
  for (const run of query.runs) {
    for (const url of run.citedUrls) {
      entries.push({ url, model: run.model });
    }
  }

  const topDomains = aggregateCitedDomains(entries).slice(0, topN);
  const sampleUrlsForFetch = topDomains
    .flatMap((d) => d.sampleUrls)
    .slice(0, 5);

  return {
    trackedQueryId: query.id,
    brandName: query.brandName,
    promptText: query.promptText,
    missedRunCount: query.runs.length,
    topDomains,
    domainsFingerprint: domainsFingerprint(topDomains, 5),
    sampleUrlsForFetch,
  };
}

export type GapAnalysisLlmInput = {
  brandName: string;
  promptText: string;
  topDomains: DomainTally[];
  pageFetches: PageFetchResult[];
  focusModelLabel?: string;
};

export class GapAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GapAnalysisError";
  }
}

const SYSTEM = `You are a GEO analyst explaining why a brand may be missing from AI answers for a specific query.

Rules (honesty — non-negotiable):
- Only describe page content for URLs marked status=ok with a text excerpt provided.
- If a URL is blocked_by_robots or failed, say you could not read that page. Do not invent what it covers from the URL alone.
- Do not claim the user's content caused or will cause citations.
- Distinguish correlation: these domains appear in citations when the brand was missed; that does not prove they blocked the brand.

Return plain text (no markdown fences) with:
1) Dominating sources: 2–4 sentences on which domains show up most and on which models
2) Content patterns: for readable pages only, note likely format (comparison, listicle, docs, review, etc.) and topics covered
3) Gap vs brand: what the brand appears to lack relative to those readable sources (hedge if evidence is thin)
4) Caveats: one short honesty note about fetch failures / limited sample

Keep under 280 words.`;

/**
 * Generate gap analysis via the same OpenAI chat path as Phase 6 fix suggestions.
 */
export async function generateGapAnalysisText(
  input: GapAnalysisLlmInput
): Promise<{ analysisText: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new GapAnalysisError(
      "OPENAI_API_KEY is not configured, so gap analysis cannot be generated"
    );
  }

  const model =
    process.env.OPENAI_GAP_ANALYSIS_MODEL?.trim() ||
    process.env.OPENAI_FIX_SUGGESTION_MODEL?.trim() ||
    "gpt-4o-mini";

  const domainLines = input.topDomains
    .slice(0, 8)
    .map(
      (d) =>
        `- ${d.domain}: ${d.count} citation(s); models=${d.models.join(",")}; samples=${d.sampleUrls.join(" | ") || "none"}`
    )
    .join("\n");

  const fetchLines = input.pageFetches
    .map((f) => {
      if (f.status === "ok") {
        return `URL: ${f.url}\nstatus: ok\nexcerpt: ${f.textExcerpt ?? ""}`;
      }
      return `URL: ${f.url}\nstatus: ${f.status}\ndetail: ${f.detail ?? ""}`;
    })
    .join("\n\n");

  const user = [
    `Brand: ${input.brandName}`,
    `Tracked query: ${input.promptText}`,
    input.focusModelLabel
      ? `UI focus model (optional context): ${input.focusModelLabel}`
      : null,
    "",
    "Top domains cited on runs where the brand was NOT mentioned:",
    domainLines || "(no cited URLs on missed runs)",
    "",
    "Fetched page notes:",
    fetchLines || "(no pages fetched)",
    "",
    "Write the gap analysis now.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 650,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      "[gap-analysis] OpenAI error",
      response.status,
      detail.slice(0, 300)
    );
    throw new GapAnalysisError(
      `Gap analysis generation failed (OpenAI HTTP ${response.status})`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const analysisText = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (analysisText.length < 40) {
    throw new GapAnalysisError(
      "OpenAI returned an empty or too-short gap analysis"
    );
  }

  return { analysisText, model };
}

export async function collectPageEvidence(
  sampleUrls: string[]
): Promise<PageFetchResult[]> {
  return fetchTopPagesForAnalysis(sampleUrls, 3);
}
