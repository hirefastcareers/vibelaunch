-- Phase 5: store competitor mention + sentiment alongside CitationRun.sentiment.
-- Brand sentiment column already exists (CitationSentiment); classifier fills it at runtime.
-- LLM backfill of historical rows is NOT done in SQL (cannot call OpenAI here).
-- Automated backfill runs via /api/cron/backfill-sentiment (see vercel.json) after deploy.

CREATE TABLE "CitationCompetitorMention" (
    "id" TEXT NOT NULL,
    "citationRunId" TEXT NOT NULL,
    "competitorBrandId" TEXT NOT NULL,
    "mentioned" BOOLEAN NOT NULL DEFAULT true,
    "sentiment" "CitationSentiment",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationCompetitorMention_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CitationCompetitorMention_competitorBrandId_idx" ON "CitationCompetitorMention"("competitorBrandId");
CREATE INDEX "CitationCompetitorMention_citationRunId_idx" ON "CitationCompetitorMention"("citationRunId");
CREATE INDEX "CitationCompetitorMention_sentiment_idx" ON "CitationCompetitorMention"("sentiment");
CREATE UNIQUE INDEX "CitationCompetitorMention_citationRunId_competitorBrandId_key" ON "CitationCompetitorMention"("citationRunId", "competitorBrandId");
CREATE INDEX "CitationRun_brandMentioned_sentiment_idx" ON "CitationRun"("brandMentioned", "sentiment");

ALTER TABLE "CitationCompetitorMention" ADD CONSTRAINT "CitationCompetitorMention_citationRunId_fkey" FOREIGN KEY ("citationRunId") REFERENCES "CitationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CitationCompetitorMention" ADD CONSTRAINT "CitationCompetitorMention_competitorBrandId_fkey" FOREIGN KEY ("competitorBrandId") REFERENCES "CompetitorBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
