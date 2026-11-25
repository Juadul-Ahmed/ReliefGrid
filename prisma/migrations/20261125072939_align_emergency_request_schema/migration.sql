/*
  Warnings:

  - The values [NORMAL] on the enum `EmergencyRequestPriority` will be removed. If these variants are still used in the database, this will fail.
  - The values [OPEN,CLOSED,CANCELLED] on the enum `EmergencyRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cancellationReason` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `closedAt` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `neededBy` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `requestingOrganizationId` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `emergency_request` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `emergency_request_item` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `emergency_request_item` table. All the data in the column will be lost.
  - You are about to drop the column `quantityFulfilled` on the `emergency_request_item` table. All the data in the column will be lost.
  - You are about to drop the column `quantityRequested` on the `emergency_request_item` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `emergency_request_item` table. All the data in the column will be lost.
  - You are about to drop the `emergency_request_fulfillment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `emergency_request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `emergency_request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `emergency_request_item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmergencyRequestCategory" AS ENUM ('FOOD', 'DRINKING_WATER', 'MEDICAL_SUPPLIES', 'SHELTER', 'RESCUE', 'TRANSPORTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceAllocationStatus" AS ENUM ('ALLOCATED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "EmergencyRequestPriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
ALTER TABLE "public"."emergency_request" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "emergency_request" ALTER COLUMN "priority" TYPE "EmergencyRequestPriority_new" USING ("priority"::text::"EmergencyRequestPriority_new");
ALTER TYPE "EmergencyRequestPriority" RENAME TO "EmergencyRequestPriority_old";
ALTER TYPE "EmergencyRequestPriority_new" RENAME TO "EmergencyRequestPriority";
DROP TYPE "public"."EmergencyRequestPriority_old";
ALTER TABLE "emergency_request" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EmergencyRequestStatus_new" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'IN_PROGRESS', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED');
ALTER TABLE "public"."emergency_request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "emergency_request" ALTER COLUMN "status" TYPE "EmergencyRequestStatus_new" USING ("status"::text::"EmergencyRequestStatus_new");
ALTER TYPE "EmergencyRequestStatus" RENAME TO "EmergencyRequestStatus_old";
ALTER TYPE "EmergencyRequestStatus_new" RENAME TO "EmergencyRequestStatus";
DROP TYPE "public"."EmergencyRequestStatus_old";
ALTER TABLE "emergency_request" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "emergency_request" DROP CONSTRAINT "emergency_request_createdById_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request" DROP CONSTRAINT "emergency_request_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request" DROP CONSTRAINT "emergency_request_requestingOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request_fulfillment" DROP CONSTRAINT "emergency_request_fulfillment_itemId_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request_fulfillment" DROP CONSTRAINT "emergency_request_fulfillment_offeredById_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request_fulfillment" DROP CONSTRAINT "emergency_request_fulfillment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request_fulfillment" DROP CONSTRAINT "emergency_request_fulfillment_requestId_fkey";

-- DropForeignKey
ALTER TABLE "emergency_request_fulfillment" DROP CONSTRAINT "emergency_request_fulfillment_respondedById_fkey";

-- DropIndex
DROP INDEX "emergency_request_createdById_idx";

-- DropIndex
DROP INDEX "emergency_request_neededBy_idx";

-- DropIndex
DROP INDEX "emergency_request_requestingOrganizationId_status_idx";

-- DropIndex
DROP INDEX "emergency_request_status_priority_idx";

-- DropIndex
DROP INDEX "emergency_request_visibility_status_idx";

-- DropIndex
DROP INDEX "emergency_request_item_category_idx";

-- DropIndex
DROP INDEX "emergency_request_item_requestId_status_idx";

-- AlterTable
ALTER TABLE "emergency_request" DROP COLUMN "cancellationReason",
DROP COLUMN "cancelledAt",
DROP COLUMN "closedAt",
DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
DROP COLUMN "createdById",
DROP COLUMN "neededBy",
DROP COLUMN "requestingOrganizationId",
DROP COLUMN "visibility",
ADD COLUMN     "category" "EmergencyRequestCategory" NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "requiredBy" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT,
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM',
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "emergency_request_item" DROP COLUMN "category",
DROP COLUMN "notes",
DROP COLUMN "quantityFulfilled",
DROP COLUMN "quantityRequested",
DROP COLUMN "status",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "quantity" DECIMAL(14,3) NOT NULL;

-- DropTable
DROP TABLE "emergency_request_fulfillment";

-- DropEnum
DROP TYPE "EmergencyFulfillmentStatus";

-- DropEnum
DROP TYPE "EmergencyItemCategory";

-- DropEnum
DROP TYPE "EmergencyRequestItemStatus";

-- DropEnum
DROP TYPE "EmergencyRequestVisibility";

-- CreateTable
CREATE TABLE "resource_allocation" (
    "id" TEXT NOT NULL,
    "requestItemId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "allocatedById" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "status" "ResourceAllocationStatus" NOT NULL DEFAULT 'ALLOCATED',
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "trackingReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_allocation_requestItemId_status_idx" ON "resource_allocation"("requestItemId", "status");

-- CreateIndex
CREATE INDEX "resource_allocation_providerOrganizationId_status_idx" ON "resource_allocation"("providerOrganizationId", "status");

-- CreateIndex
CREATE INDEX "resource_allocation_allocatedById_idx" ON "resource_allocation"("allocatedById");

-- CreateIndex
CREATE INDEX "emergency_request_organizationId_status_createdAt_idx" ON "emergency_request"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "emergency_request_organizationId_priority_idx" ON "emergency_request"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "emergency_request_submittedById_idx" ON "emergency_request"("submittedById");

-- CreateIndex
CREATE INDEX "emergency_request_reviewedById_idx" ON "emergency_request"("reviewedById");

-- CreateIndex
CREATE INDEX "emergency_request_category_status_idx" ON "emergency_request"("category", "status");

-- CreateIndex
CREATE INDEX "emergency_request_item_requestId_idx" ON "emergency_request_item"("requestId");

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "emergency_request_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_providerOrganizationId_fkey" FOREIGN KEY ("providerOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_allocatedById_fkey" FOREIGN KEY ("allocatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
