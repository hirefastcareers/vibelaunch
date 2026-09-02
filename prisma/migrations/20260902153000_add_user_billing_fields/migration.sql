-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'PRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN "dodoCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "dodoSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "planRenewsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_dodoCustomerId_key" ON "User"("dodoCustomerId");
