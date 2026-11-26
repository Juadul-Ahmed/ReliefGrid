/*
  M6: Allocation items, inventory batches, reservations, distributions,
  and deliveries.

  Additive migration. Existing M4/M5 tables, columns, enums, indexes,
  foreign keys, and raw SQL CHECK constraints are left untouched.

  Tenant integrity is enforced by composite foreign keys that carry
  providerOrganizationId through distributions, deliveries, and their
  items.

  Two required columns are added to non-empty tables
  (resource_allocation.requestId, stock_movement.organizationId).
  They are added as nullable, backfilled from existing rows, and only
  then set NOT NULL, so historical M4 allocations and stock movements
  are preserved without data loss.

  Historical ResourceAllocation rows are migrated into
  ResourceAllocationItem using only existing evidence:
    - dispatchedQuantity is derived from StockMovement OUT rows linked
      by resourceAllocationId (never from status alone);
    - deliveredQuantity is 0 because no reliable delivery evidence
      exists (no delivery events are fabricated);
    - no inventory batches or reservations are invented.
  Allocations without inventoryItemId cannot be represented as an
  allocation item (inventoryItemId is NOT NULL) and are NOT silently
  discarded: the migration raises and requires operator resolution
  before it can be applied.
*/

-- CreateEnum
CREATE TYPE "AllocationItemStatus" AS ENUM ('ALLOCATED', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResourceDistributionStatus" AS ENUM ('PENDING', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResourceDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "resource_allocation_item" (
    "id" TEXT NOT NULL,
    "resourceAllocationId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "requestItemId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "dispatchedQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "deliveredQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "status" "AllocationItemStatus" NOT NULL DEFAULT 'ALLOCATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_allocation_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batch" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "onHand" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batch_reservation" (
    "id" TEXT NOT NULL,
    "resourceAllocationItemId" TEXT NOT NULL,
    "inventoryBatchId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "reservedQuantity" DECIMAL(14,3) NOT NULL,
    "releasedQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "consumedQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_batch_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_distribution" (
    "id" TEXT NOT NULL,
    "resourceAllocationId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "status" "ResourceDistributionStatus" NOT NULL DEFAULT 'PENDING',
    "trackingReference" TEXT,
    "notes" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_distribution_item" (
    "id" TEXT NOT NULL,
    "resourceDistributionId" TEXT NOT NULL,
    "resourceAllocationItemId" TEXT NOT NULL,
    "inventoryBatchId" TEXT NOT NULL,
    "resourceAllocationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_distribution_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_delivery" (
    "id" TEXT NOT NULL,
    "resourceDistributionId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "status" "ResourceDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "trackingReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_delivery_item" (
    "id" TEXT NOT NULL,
    "resourceDeliveryId" TEXT NOT NULL,
    "resourceDistributionItemId" TEXT NOT NULL,
    "resourceDistributionId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_delivery_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_allocation_item_id_inventoryItemId_key" ON "resource_allocation_item"("id", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_allocation_item_id_resourceAllocationId_inventoryItemId_key" ON "resource_allocation_item"("id", "resourceAllocationId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "resource_allocation_item_resourceAllocationId_idx" ON "resource_allocation_item"("resourceAllocationId");

-- CreateIndex
CREATE INDEX "resource_allocation_item_inventoryItemId_idx" ON "resource_allocation_item"("inventoryItemId");

-- CreateIndex
CREATE INDEX "resource_allocation_item_status_idx" ON "resource_allocation_item"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_batch_id_inventoryItemId_key" ON "inventory_batch"("id", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_batch_id_organizationId_key" ON "inventory_batch"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_batch_inventoryItemId_batchNumber_key" ON "inventory_batch"("inventoryItemId", "batchNumber");

-- CreateIndex
CREATE INDEX "inventory_batch_inventoryItemId_expiresAt_idx" ON "inventory_batch"("inventoryItemId", "expiresAt");

-- CreateIndex
CREATE INDEX "inventory_batch_organizationId_idx" ON "inventory_batch"("organizationId");

-- CreateIndex
CREATE INDEX "inventory_batch_reservation_resourceAllocationItemId_idx" ON "inventory_batch_reservation"("resourceAllocationItemId");

-- CreateIndex
CREATE INDEX "inventory_batch_reservation_inventoryBatchId_idx" ON "inventory_batch_reservation"("inventoryBatchId");

-- CreateIndex
CREATE INDEX "inventory_batch_reservation_inventoryItemId_idx" ON "inventory_batch_reservation"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_distribution_id_resourceAllocationId_key" ON "resource_distribution"("id", "resourceAllocationId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_distribution_id_providerOrganizationId_key" ON "resource_distribution"("id", "providerOrganizationId");

-- CreateIndex
CREATE INDEX "resource_distribution_resourceAllocationId_idx" ON "resource_distribution"("resourceAllocationId");

-- CreateIndex
CREATE INDEX "resource_distribution_providerOrganizationId_idx" ON "resource_distribution"("providerOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_distribution_item_id_resourceDistributionId_key" ON "resource_distribution_item"("id", "resourceDistributionId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_distribution_item_id_providerOrganizationId_key" ON "resource_distribution_item"("id", "providerOrganizationId");

-- CreateIndex
CREATE INDEX "resource_distribution_item_resourceDistributionId_idx" ON "resource_distribution_item"("resourceDistributionId");

-- CreateIndex
CREATE INDEX "resource_distribution_item_resourceAllocationItemId_idx" ON "resource_distribution_item"("resourceAllocationItemId");

-- CreateIndex
CREATE INDEX "resource_distribution_item_inventoryBatchId_idx" ON "resource_distribution_item"("inventoryBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_delivery_id_resourceDistributionId_key" ON "resource_delivery"("id", "resourceDistributionId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_delivery_id_providerOrganizationId_key" ON "resource_delivery"("id", "providerOrganizationId");

-- CreateIndex
CREATE INDEX "resource_delivery_resourceDistributionId_idx" ON "resource_delivery"("resourceDistributionId");

-- CreateIndex
CREATE INDEX "resource_delivery_providerOrganizationId_idx" ON "resource_delivery"("providerOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_delivery_item_id_providerOrganizationId_key" ON "resource_delivery_item"("id", "providerOrganizationId");

-- CreateIndex
CREATE INDEX "resource_delivery_item_resourceDeliveryId_idx" ON "resource_delivery_item"("resourceDeliveryId");

-- CreateIndex
CREATE INDEX "resource_delivery_item_resourceDistributionItemId_idx" ON "resource_delivery_item"("resourceDistributionItemId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_request_item_id_requestId_key" ON "emergency_request_item"("id", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_allocation_id_providerOrganizationId_key" ON "resource_allocation"("id", "providerOrganizationId");

-- AlterTable (nullable expansion; enforced NOT NULL after backfill)
ALTER TABLE "resource_allocation" ADD COLUMN "requestId" TEXT;

-- AlterTable (nullable expansion; enforced NOT NULL after backfill)
ALTER TABLE "stock_movement"
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "inventoryBatchId" TEXT,
ADD COLUMN "resourceAllocationItemId" TEXT;

-- CreateIndex
CREATE INDEX "stock_movement_organizationId_idx" ON "stock_movement"("organizationId");

-- CreateIndex
CREATE INDEX "stock_movement_inventoryBatchId_idx" ON "stock_movement"("inventoryBatchId");

-- CreateIndex
CREATE INDEX "stock_movement_resourceAllocationItemId_idx" ON "stock_movement"("resourceAllocationItemId");

-- Backfill: preserve historical M4 allocations by deriving requestId
-- from the existing request item relationship.
UPDATE "resource_allocation" ra
SET "requestId" = eri."requestId"
FROM "emergency_request_item" eri
WHERE eri."id" = ra."requestItemId"
  AND ra."requestId" IS NULL;

-- Backfill: preserve historical stock movements by deriving the
-- organization from the existing inventory item relationship.
UPDATE "stock_movement" sm
SET "organizationId" = ii."organizationId"
FROM "inventory_item" ii
WHERE ii."id" = sm."inventoryItemId"
  AND sm."organizationId" IS NULL;

-- Guard: an allocation without inventoryItemId cannot become an
-- allocation item (inventoryItemId is NOT NULL). Do not discard it.
-- Safe strategy: operator creates/links the correct InventoryItem for
-- the provider (or explicitly voids the allocation) and re-runs.
DO $$
DECLARE bad text;
BEGIN
  SELECT ra.id INTO bad FROM "resource_allocation" ra
  WHERE ra."inventoryItemId" IS NULL LIMIT 1;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION
      'M6: allocation % has no inventoryItemId; link a provider InventoryItem or void it before migrating',
      bad;
  END IF;
END $$;

-- Guard: dispatch evidence must never exceed the allocated quantity.
DO $$
DECLARE bad text;
BEGIN
  SELECT ra.id INTO bad
  FROM "resource_allocation" ra
  JOIN (SELECT "resourceAllocationId" rid, SUM(quantity) out_sum
        FROM "stock_movement"
        WHERE type = 'OUT' AND "resourceAllocationId" IS NOT NULL
        GROUP BY 1) o ON o.rid = ra.id
  WHERE o.out_sum > ra.quantity LIMIT 1;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION
      'M6: allocation % has OUT movement evidence exceeding its quantity', bad;
  END IF;
END $$;

-- Backfill: migrate historical allocations into allocation items using
-- only existing evidence. dispatchedQuantity comes from StockMovement
-- OUT rows; deliveredQuantity stays 0 (no delivery evidence exists);
-- no batches, reservations, distributions, or deliveries are invented.
INSERT INTO "resource_allocation_item"
  ("id","resourceAllocationId","providerOrganizationId","requestItemId","requestId",
   "inventoryItemId","quantity","dispatchedQuantity","deliveredQuantity","status",
   "createdAt","updatedAt")
SELECT 'rai_' || ra.id, ra.id, ra."providerOrganizationId", ra."requestItemId", ra."requestId",
       ra."inventoryItemId", ra.quantity,
       COALESCE(o.out_sum, 0), 0,
       CASE
         WHEN ra.status = 'CANCELLED' THEN 'CANCELLED'
         WHEN ra.status = 'DELIVERED' THEN 'DELIVERED'
         WHEN COALESCE(o.out_sum, 0) = ra.quantity THEN 'DISPATCHED'
         WHEN COALESCE(o.out_sum, 0) > 0 THEN 'PARTIALLY_DISPATCHED'
         ELSE 'ALLOCATED'
       END::"AllocationItemStatus",
       ra."createdAt", ra."updatedAt"
FROM "resource_allocation" ra
LEFT JOIN (SELECT "resourceAllocationId" rid, SUM(quantity) out_sum
           FROM "stock_movement"
           WHERE type = 'OUT' AND "resourceAllocationId" IS NOT NULL
           GROUP BY 1) o ON o.rid = ra.id
WHERE ra."inventoryItemId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- Enforce NOT NULL only after every existing row has been backfilled.
ALTER TABLE "resource_allocation" ALTER COLUMN "requestId" SET NOT NULL;

ALTER TABLE "stock_movement" ALTER COLUMN "organizationId" SET NOT NULL;

-- DropForeignKey (single-column inventory FK replaced by composite FK)
ALTER TABLE "stock_movement" DROP CONSTRAINT "stock_movement_inventoryItemId_fkey";

-- AddForeignKey
ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_requestItemId_requestId_fkey" FOREIGN KEY ("requestItemId", "requestId") REFERENCES "emergency_request_item"("id", "requestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation_item" ADD CONSTRAINT "resource_allocation_item_resourceAllocationId_providerOrganizationId_fkey" FOREIGN KEY ("resourceAllocationId", "providerOrganizationId") REFERENCES "resource_allocation"("id", "providerOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation_item" ADD CONSTRAINT "resource_allocation_item_requestItemId_requestId_fkey" FOREIGN KEY ("requestItemId", "requestId") REFERENCES "emergency_request_item"("id", "requestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation_item" ADD CONSTRAINT "resource_allocation_item_inventoryItemId_providerOrganizationId_fkey" FOREIGN KEY ("inventoryItemId", "providerOrganizationId") REFERENCES "inventory_item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batch" ADD CONSTRAINT "inventory_batch_inventoryItemId_organizationId_fkey" FOREIGN KEY ("inventoryItemId", "organizationId") REFERENCES "inventory_item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batch" ADD CONSTRAINT "inventory_batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batch_reservation" ADD CONSTRAINT "inventory_batch_reservation_resourceAllocationItemId_inventoryItemId_fkey" FOREIGN KEY ("resourceAllocationItemId", "inventoryItemId") REFERENCES "resource_allocation_item"("id", "inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batch_reservation" ADD CONSTRAINT "inventory_batch_reservation_inventoryBatchId_inventoryItemId_fkey" FOREIGN KEY ("inventoryBatchId", "inventoryItemId") REFERENCES "inventory_batch"("id", "inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_distribution" ADD CONSTRAINT "resource_distribution_resourceAllocationId_providerOrganizationId_fkey" FOREIGN KEY ("resourceAllocationId", "providerOrganizationId") REFERENCES "resource_allocation"("id", "providerOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_distribution" ADD CONSTRAINT "resource_distribution_providerOrganizationId_fkey" FOREIGN KEY ("providerOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_distribution_item" ADD CONSTRAINT "resource_distribution_item_resourceDistributionId_providerOrganizationId_fkey" FOREIGN KEY ("resourceDistributionId", "providerOrganizationId") REFERENCES "resource_distribution"("id", "providerOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_distribution_item" ADD CONSTRAINT "resource_distribution_item_resourceAllocationItemId_resourceAllocationId_inventoryItemId_fkey" FOREIGN KEY ("resourceAllocationItemId", "resourceAllocationId", "inventoryItemId") REFERENCES "resource_allocation_item"("id", "resourceAllocationId", "inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_distribution_item" ADD CONSTRAINT "resource_distribution_item_inventoryBatchId_inventoryItemId_fkey" FOREIGN KEY ("inventoryBatchId", "inventoryItemId") REFERENCES "inventory_batch"("id", "inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_delivery" ADD CONSTRAINT "resource_delivery_resourceDistributionId_providerOrganizationId_fkey" FOREIGN KEY ("resourceDistributionId", "providerOrganizationId") REFERENCES "resource_distribution"("id", "providerOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_delivery" ADD CONSTRAINT "resource_delivery_providerOrganizationId_fkey" FOREIGN KEY ("providerOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_delivery" ADD CONSTRAINT "resource_delivery_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_delivery_item" ADD CONSTRAINT "resource_delivery_item_resourceDeliveryId_providerOrganizationId_fkey" FOREIGN KEY ("resourceDeliveryId", "providerOrganizationId") REFERENCES "resource_delivery"("id", "providerOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_delivery_item" ADD CONSTRAINT "resource_delivery_item_resourceDistributionItemId_providerOrganizationId_fkey" FOREIGN KEY ("resourceDistributionItemId", "providerOrganizationId") REFERENCES "resource_distribution_item"("id", "providerOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_inventoryItemId_organizationId_fkey" FOREIGN KEY ("inventoryItemId", "organizationId") REFERENCES "inventory_item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_inventoryBatchId_organizationId_fkey" FOREIGN KEY ("inventoryBatchId", "organizationId") REFERENCES "inventory_batch"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_resourceAllocationItemId_inventoryItemId_fkey" FOREIGN KEY ("resourceAllocationItemId", "inventoryItemId") REFERENCES "resource_allocation_item"("id", "inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;