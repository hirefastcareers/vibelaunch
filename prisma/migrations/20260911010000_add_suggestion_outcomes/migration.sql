-- AlterTable
ALTER TABLE "ContentSuggestion" ADD COLUMN     "publishedUrl" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "SuggestionMatchType" AS ENUM ('EXACT', 'DOMAIN');

-- CreateTable
CREATE TABLE "SuggestionOutcome" (
    "id" TEXT NOT NULL,
    "contentSuggestionId" TEXT NOT NULL,
    "citationRunId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" "CitationModel" NOT NULL,
    "matchType" "SuggestionMatchType" NOT NULL,

    CONSTRAINT "SuggestionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentSuggestion_publishedAt_idx" ON "ContentSuggestion"("publishedAt");

-- CreateIndex
CREATE INDEX "SuggestionOutcome_contentSuggestionId_idx" ON "SuggestionOutcome"("contentSuggestionId");

-- CreateIndex
CREATE INDEX "SuggestionOutcome_citationRunId_idx" ON "SuggestionOutcome"("citationRunId");

-- CreateIndex
CREATE INDEX "SuggestionOutcome_matchedAt_idx" ON "SuggestionOutcome"("matchedAt");

-- CreateIndex
CREATE INDEX "SuggestionOutcome_matchType_idx" ON "SuggestionOutcome"("matchType");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionOutcome_contentSuggestionId_citationRunId_matchType_key" ON "SuggestionOutcome"("contentSuggestionId", "citationRunId", "matchType");

-- AddForeignKey
ALTER TABLE "SuggestionOutcome" ADD CONSTRAINT "SuggestionOutcome_contentSuggestionId_fkey" FOREIGN KEY ("contentSuggestionId") REFERENCES "ContentSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionOutcome" ADD CONSTRAINT "SuggestionOutcome_citationRunId_fkey" FOREIGN KEY ("citationRunId") REFERENCES "CitationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
