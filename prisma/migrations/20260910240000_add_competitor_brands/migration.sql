-- CreateTable
CREATE TABLE "CompetitorBrand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorBrand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitorBrand_userId_idx" ON "CompetitorBrand"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorBrand_userId_brandName_key" ON "CompetitorBrand"("userId", "brandName");

-- AddForeignKey
ALTER TABLE "CompetitorBrand" ADD CONSTRAINT "CompetitorBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
