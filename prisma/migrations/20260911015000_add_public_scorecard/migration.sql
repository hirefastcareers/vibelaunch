-- Phase 9: opt-in public AI visibility scorecard (off by default).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scorecardPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scorecardSlug" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scorecardPublishedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_scorecardSlug_key" ON "User"("scorecardSlug");
