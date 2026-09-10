-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('NEW', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "ContentSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedQueryId" TEXT NOT NULL,
    "model" "CitationModel" NOT NULL,
    "suggestionText" TEXT NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'NEW',
    "regenerationCount" INTEGER NOT NULL DEFAULT 0,
    "regenerationWindowStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentSuggestion_userId_idx" ON "ContentSuggestion"("userId");

-- CreateIndex
CREATE INDEX "ContentSuggestion_trackedQueryId_idx" ON "ContentSuggestion"("trackedQueryId");

-- CreateIndex
CREATE INDEX "ContentSuggestion_status_idx" ON "ContentSuggestion"("status");

-- CreateIndex
CREATE INDEX "ContentSuggestion_userId_trackedQueryId_model_idx" ON "ContentSuggestion"("userId", "trackedQueryId", "model");

-- AddForeignKey
ALTER TABLE "ContentSuggestion" ADD CONSTRAINT "ContentSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSuggestion" ADD CONSTRAINT "ContentSuggestion_trackedQueryId_fkey" FOREIGN KEY ("trackedQueryId") REFERENCES "TrackedQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
