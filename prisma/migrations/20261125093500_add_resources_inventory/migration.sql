/*
  M5: Resource & Inventory Management.

  Adds the organization-owned resource catalog, per-organization inventory
  items, and an append-only stock movement ledger. Also adds a nullable
  inventoryItemId link on resource_allocation so existing M4 allocations remain
  valid (inventoryItemId = NULL).

  This migration is additive only. Existing migrations are not modified.
*/

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('FOOD', 'DRINKING_WATER', 'MEDICAL_SUPPLIES', 'SHELTER', 'RESCUE', 'TRANSPORTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUST');

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "onHand" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "reason" TEXT,
    "resourceAllocationId" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_organizationId_name_key" ON "resource"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "resource_id_organizationId_key" ON "resource"("id", "organizationId");

-- CreateIndex
CREATE INDEX "resource_organizationId_category_idx" ON "resource"("organizationId", "category");

-- CreateIndex
CREATE INDEX "resource_organizationId_isActive_idx" ON "resource"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_organizationId_resourceId_key" ON "inventory_item"("organizationId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_id_organizationId_key" ON "inventory_item"("id", "organizationId");

-- CreateIndex
CREATE INDEX "inventory_item_organizationId_idx" ON "inventory_item"("organizationId");

-- CreateIndex
CREATE INDEX "inventory_item_organizationId_isActive_idx" ON "inventory_item"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "stock_movement_inventoryItemId_createdAt_idx" ON "stock_movement"("inventoryItemId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movement_type_idx" ON "stock_movement"("type");

-- CreateIndex
CREATE INDEX "stock_movement_resourceAllocationId_idx" ON "stock_movement"("resourceAllocationId");

-- CreateIndex
CREATE INDEX "stock_movement_actorUserId_idx" ON "stock_movement"("actorUserId");

-- AlterTable
ALTER TABLE "resource_allocation" ADD COLUMN "inventoryItemId" TEXT;

-- CreateIndex
CREATE INDEX "resource_allocation_inventoryItemId_idx" ON "resource_allocation"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_resourceId_organizationId_fkey" FOREIGN KEY ("resourceId", "organizationId") REFERENCES "resource"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_resourceAllocationId_fkey" FOREIGN KEY ("resourceAllocationId") REFERENCES "resource_allocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_inventoryItemId_providerOrganizationId_fkey" FOREIGN KEY ("inventoryItemId", "providerOrganizationId") REFERENCES "inventory_item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateCheckConstraints (DB-only; not represented in the Prisma schema)
ALTER TABLE "inventory_item"
  ADD CONSTRAINT "inventory_item_on_hand_nonneg" CHECK ("onHand" >= 0),
  ADD CONSTRAINT "inventory_item_reserved_nonneg" CHECK ("reserved" >= 0),
  ADD CONSTRAINT "inventory_item_reserved_le_on_hand" CHECK ("reserved" <= "onHand");

ALTER TABLE "stock_movement"
  ADD CONSTRAINT "stock_movement_quantity_valid" CHECK (
    ("type"::text IN ('IN', 'OUT', 'RESERVE', 'RELEASE') AND "quantity" > 0)
    OR ("type"::text = 'ADJUST' AND "quantity" <> 0)
  );