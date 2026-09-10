import type { CitationRun, CitationSentiment } from "@prisma/client";
import { detectBrandMention } from "@/lib/geo/brand-mention";
import { classifyMentionSentiment } from "@/lib/geo/classify-sentiment";
import { prisma } from "@/lib/prisma";

export type AttachSentimentResult = {
  brandSentiment: CitationSentiment | null;
  competitorMentionsWritten: number;
};

/**
 * After a successful CitationRun is persisted, classify brand + competitor
 * mention sentiment. Skips brand classification when brandMentioned=false
 * (sentiment stays null). Classification failures leave null — never invent.
 */
export async function attachSentimentsForRun(
  run: Pick<
    CitationRun,
    "id" | "rawResponse" | "brandMentioned" | "error"
  >,
  context: {
    userId: string;
    brandName: string;
  }
): Promise<AttachSentimentResult> {
  if (run.error || !run.rawResponse.trim()) {
    return { brandSentiment: null, competitorMentionsWritten: 0 };
  }

  let brandSentiment: CitationSentiment | null = null;

  if (run.brandMentioned) {
    brandSentiment = await classifyMentionSentiment({
      brandName: context.brandName,
      rawResponse: run.rawResponse,
    });
    if (brandSentiment) {
      await prisma.citationRun.update({
        where: { id: run.id },
        data: { sentiment: brandSentiment },
      });
    }
  }

  const competitors = await prisma.competitorBrand.findMany({
    where: { userId: context.userId },
    select: { id: true, brandName: true },
  });

  let competitorMentionsWritten = 0;
  for (const competitor of competitors) {
    const mentioned = detectBrandMention(
      run.rawResponse,
      competitor.brandName
    );
    if (!mentioned) continue;

    const sentiment = await classifyMentionSentiment({
      brandName: competitor.brandName,
      rawResponse: run.rawResponse,
    });

    await prisma.citationCompetitorMention.upsert({
      where: {
        citationRunId_competitorBrandId: {
          citationRunId: run.id,
          competitorBrandId: competitor.id,
        },
      },
      create: {
        citationRunId: run.id,
        competitorBrandId: competitor.id,
        mentioned: true,
        sentiment,
      },
      update: {
        mentioned: true,
        sentiment,
      },
    });
    competitorMentionsWritten += 1;
  }

  return { brandSentiment, competitorMentionsWritten };
}
