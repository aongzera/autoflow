/*
  Warnings:

  - A unique constraint covering the columns `[lineWebhookEventId]` on the table `Photo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Claim" ALTER COLUMN "eClaimNo" SET DEFAULT NULL;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "lineWebhookEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Photo_lineWebhookEventId_key" ON "Photo"("lineWebhookEventId");
