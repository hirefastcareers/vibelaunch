-- CreateEnum
CREATE TYPE "CitationModel" AS ENUM ('openai', 'anthropic', 'gemini', 'perplexity');

-- CreateEnum
CREATE TYPE "CitationSentiment" AS ENUM ('positive', 'neutral', 'negative');

-- CreateTable
CREATE TABLE "TrackedQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationRun" (
    "id" TEXT NOT NULL,
    "trackedQueryId" TEXT NOT NULL,
    "model" "CitationModel" NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawResponse" TEXT NOT NULL,
    "brandMentioned" BOOLEAN NOT NULL DEFAULT false,
    "citedUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" "CitationSentiment",
    "error" TEXT,

    CONSTRAINT "CitationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackedQuery_userId_idx" ON "TrackedQuery"("userId");

-- CreateIndex
CREATE INDEX "TrackedQuery_active_idx" ON "TrackedQuery"("active");

-- CreateIndex
CREATE INDEX "CitationRun_trackedQueryId_idx" ON "CitationRun"("trackedQueryId");

-- CreateIndex
CREATE INDEX "CitationRun_model_idx" ON "CitationRun"("model");

-- CreateIndex
CREATE INDEX "CitationRun_runAt_idx" ON "CitationRun"("runAt");

-- AddForeignKey
ALTER TABLE "TrackedQuery" ADD CONSTRAINT "TrackedQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationRun" ADD CONSTRAINT "CitationRun_trackedQueryId_fkey" FOREIGN KEY ("trackedQueryId") REFERENCES "TrackedQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
