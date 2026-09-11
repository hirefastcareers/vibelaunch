-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CITATION_LOST', 'CITATION_GAINED', 'COMPETITOR_OVERTAKE', 'SENTIMENT_FLIP');

-- CreateEnum
CREATE TYPE "AlertDigestFrequency" AS ENUM ('OFF', 'WEEKLY', 'IMMEDIATE');

-- CreateTable
CREATE TABLE "AlertPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citationLostEnabled" BOOLEAN NOT NULL DEFAULT true,
    "citationGainedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "competitorOvertakeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sentimentFlipEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" "AlertDigestFrequency" NOT NULL DEFAULT 'WEEKLY',
    "webhookUrl" TEXT,
    "webhookFailCount" INTEGER NOT NULL DEFAULT 0,
    "webhookLastError" TEXT,
    "webhookLastSuccessAt" TIMESTAMP(3),
    "webhookDisabledAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedQueryId" TEXT,
    "type" "AlertType" NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deliverySkippedReason" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertPendingChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedQueryId" TEXT NOT NULL,
    "model" "CitationModel" NOT NULL,
    "type" "AlertType" NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "consecutiveCount" INTEGER NOT NULL DEFAULT 1,
    "lastRunId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertPendingChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertPreference_userId_key" ON "AlertPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertPreference_unsubscribeToken_key" ON "AlertPreference"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Alert_userId_readAt_idx" ON "Alert"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Alert_userId_createdAt_idx" ON "Alert"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_deliveredAt_idx" ON "Alert"("deliveredAt");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "AlertPendingChange_userId_idx" ON "AlertPendingChange"("userId");

-- CreateIndex
CREATE INDEX "AlertPendingChange_trackedQueryId_idx" ON "AlertPendingChange"("trackedQueryId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertPendingChange_userId_trackedQueryId_fingerprint_key" ON "AlertPendingChange"("userId", "trackedQueryId", "fingerprint");

-- AddForeignKey
ALTER TABLE "AlertPreference" ADD CONSTRAINT "AlertPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_trackedQueryId_fkey" FOREIGN KEY ("trackedQueryId") REFERENCES "TrackedQuery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertPendingChange" ADD CONSTRAINT "AlertPendingChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertPendingChange" ADD CONSTRAINT "AlertPendingChange_trackedQueryId_fkey" FOREIGN KEY ("trackedQueryId") REFERENCES "TrackedQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
