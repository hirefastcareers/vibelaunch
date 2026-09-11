-- Review pass: bound sentiment backfill retries + count gap-analysis regenerations toward monthly quota.
ALTER TABLE "CitationRun" ADD COLUMN IF NOT EXISTS "sentimentClassifyFailed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CitationGapAnalysis" ADD COLUMN IF NOT EXISTS "generationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CitationGapAnalysis" ADD COLUMN IF NOT EXISTS "generationWindowStart" TIMESTAMP(3);
