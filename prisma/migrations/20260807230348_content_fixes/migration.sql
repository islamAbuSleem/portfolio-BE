/*
  Warnings:

  - Added the required column `updatedAt` to the `About` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MagicToken` table without a default value. This is not possible if the table is not empty.

  Resolution: DEFAULT CURRENT_TIMESTAMP added so existing rows backfill safely.
*/
-- AlterTable
ALTER TABLE "About" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MagicToken" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Experience_userId_order_idx" ON "Experience"("userId", "order");

-- CreateIndex
CREATE INDEX "MagicToken_token_idx" ON "MagicToken"("token");

-- CreateIndex
CREATE INDEX "Project_userId_order_idx" ON "Project"("userId", "order");

-- CreateIndex
CREATE INDEX "Skill_userId_order_idx" ON "Skill"("userId", "order");
