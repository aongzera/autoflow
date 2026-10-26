-- CreateEnum
CREATE TYPE "ClaimStage" AS ENUM ('CONTACTED', 'PRICED', 'DROPPED_OFF', 'IN_REPAIR', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PhotoStage" AS ENUM ('CONTACT', 'INTAKE', 'PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "PhotoSource" AS ENUM ('LINE', 'WEB_UPLOAD');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'IGNORED');

-- CreateEnum
CREATE TYPE "EmcsUploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmcsDocType" AS ENUM ('SUPPORTING_DOC', 'CLAIM_FORM', 'DRIVER_LICENSE', 'PRE_REPAIR_CONDITION', 'PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmcsJobType" AS ENUM ('CREATE_RECEIPT', 'CREATE_CLAIM', 'PUSH_PHOTOS', 'UPDATE_STAGE');

-- CreateEnum
CREATE TYPE "EmcsJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "FuelLevel" AS ENUM ('E', 'QUARTER', 'HALF', 'THREE_QUARTER', 'F');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "thaiId" TEXT,
    "driverLicenseNo" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lineUserId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "VIN" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("VIN")
);

-- CreateTable
CREATE TABLE "Insurer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Insurer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" SERIAL NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "insurerId" INTEGER NOT NULL,
    "dropOff" BOOLEAN NOT NULL DEFAULT false,
    "stage" "ClaimStage" NOT NULL DEFAULT 'CONTACTED',
    "claimDocNo" TEXT NOT NULL,
    "emcsClaimRef" TEXT,
    "contactDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropOffDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER,
    "stage" "PhotoStage" NOT NULL,
    "emcsDocType" "EmcsDocType",
    "storageUrl" TEXT NOT NULL,
    "lineSenderId" TEXT,
    "source" "PhotoSource" NOT NULL DEFAULT 'LINE',
    "lineMessageId" TEXT,
    "lineGroupId" TEXT,
    "lineCaption" TEXT,
    "matchStatus" "MatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "emcsStatus" "EmcsUploadStatus" NOT NULL DEFAULT 'PENDING',
    "emcsUploadedAt" TIMESTAMP(3),
    "emcsError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmcsJob" (
    "id" TEXT NOT NULL,
    "claimId" INTEGER NOT NULL,
    "jobType" "EmcsJobType" NOT NULL,
    "status" "EmcsJobStatus" NOT NULL DEFAULT 'QUEUED',
    "photoStage" "PhotoStage",
    "photosTotal" INTEGER,
    "photosUploaded" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "resultRef" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmcsJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleEquipment" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "mileageKm" INTEGER NOT NULL,
    "fuelLevel" "FuelLevel" NOT NULL,
    "spareTire" BOOLEAN NOT NULL DEFAULT false,
    "hubCap" BOOLEAN NOT NULL DEFAULT false,
    "jack" BOOLEAN NOT NULL DEFAULT false,
    "floorMats" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VehicleEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingSession" (
    "id" TEXT NOT NULL,
    "lineGroupId" TEXT NOT NULL,
    "lineSenderId" TEXT NOT NULL,
    "claimId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_thaiId_key" ON "Customer"("thaiId");

-- CreateIndex
CREATE UNIQUE INDEX "Insurer_name_key" ON "Insurer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_insurerId_claimDocNo_key" ON "Claim"("insurerId", "claimDocNo");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_lineMessageId_key" ON "Photo"("lineMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleEquipment_claimId_key" ON "VehicleEquipment"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingSession_lineGroupId_lineSenderId_key" ON "RoutingSession"("lineGroupId", "lineSenderId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("VIN") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmcsJob" ADD CONSTRAINT "EmcsJob_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleEquipment" ADD CONSTRAINT "VehicleEquipment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingSession" ADD CONSTRAINT "RoutingSession_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
