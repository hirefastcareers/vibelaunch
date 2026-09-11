-- CreateTable
CREATE TABLE "CitationGapAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedQueryId" TEXT NOT NULL,
    "topDomains" JSONB NOT NULL,
    "domainsFingerprint" TEXT NOT NULL,
    "analysisText" TEXT NOT NULL,
    "fetchNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitationGapAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CitationGapAnalysis_trackedQueryId_key" ON "CitationGapAnalysis"("trackedQueryId");

-- CreateIndex
CREATE INDEX "CitationGapAnalysis_userId_idx" ON "CitationGapAnalysis"("userId");

-- CreateIndex
CREATE INDEX "CitationGapAnalysis_createdAt_idx" ON "CitationGapAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "CitationGapAnalysis" ADD CONSTRAINT "CitationGapAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationGapAnalysis" ADD CONSTRAINT "CitationGapAnalysis_trackedQueryId_fkey" FOREIGN KEY ("trackedQueryId") REFERENCES "TrackedQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
