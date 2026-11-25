-- CreateEnum
CREATE TYPE "EmergencyRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmergencyRequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EmergencyRequestVisibility" AS ENUM ('ORGANIZATION', 'INCIDENT_PARTICIPANTS', 'NETWORK');

-- CreateEnum
CREATE TYPE "EmergencyItemCategory" AS ENUM ('FOOD', 'WATER', 'MEDICAL_SUPPLIES', 'SHELTER_SUPPLIES', 'CLOTHING', 'FUEL', 'EQUIPMENT', 'PERSONNEL', 'TRANSPORTATION', 'COMMUNICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyRequestItemStatus" AS ENUM ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmergencyFulfillmentStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'REJECTED', 'WITHDRAWN', 'CANCELLED');

-- CreateTable
CREATE TABLE "emergency_request" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "EmergencyRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "EmergencyRequestStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "EmergencyRequestVisibility" NOT NULL DEFAULT 'NETWORK',
    "requestingOrganizationId" TEXT NOT NULL,
    "incidentId" TEXT,
    "createdById" TEXT,
    "locationName" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "neededBy" TIMESTAMP(3),
    "contactName" TEXT,
    "contactPhone" TEXT,
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_request_item" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EmergencyItemCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "quantityRequested" INTEGER NOT NULL,
    "quantityFulfilled" INTEGER NOT NULL DEFAULT 0,
    "status" "EmergencyRequestItemStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_request_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_request_fulfillment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "EmergencyFulfillmentStatus" NOT NULL DEFAULT 'OFFERED',
    "quantityOffered" INTEGER NOT NULL,
    "quantityDelivered" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "estimatedDeliveryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "offeredById" TEXT,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_request_fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emergency_request_requestNumber_key" ON "emergency_request"("requestNumber");

-- CreateIndex
CREATE INDEX "emergency_request_requestingOrganizationId_status_idx" ON "emergency_request"("requestingOrganizationId", "status");

-- CreateIndex
CREATE INDEX "emergency_request_incidentId_idx" ON "emergency_request"("incidentId");

-- CreateIndex
CREATE INDEX "emergency_request_status_priority_idx" ON "emergency_request"("status", "priority");

-- CreateIndex
CREATE INDEX "emergency_request_visibility_status_idx" ON "emergency_request"("visibility", "status");

-- CreateIndex
CREATE INDEX "emergency_request_createdById_idx" ON "emergency_request"("createdById");

-- CreateIndex
CREATE INDEX "emergency_request_neededBy_idx" ON "emergency_request"("neededBy");

-- CreateIndex
CREATE INDEX "emergency_request_item_requestId_status_idx" ON "emergency_request_item"("requestId", "status");

-- CreateIndex
CREATE INDEX "emergency_request_item_category_idx" ON "emergency_request_item"("category");

-- CreateIndex
CREATE INDEX "emergency_request_fulfillment_requestId_status_idx" ON "emergency_request_fulfillment"("requestId", "status");

-- CreateIndex
CREATE INDEX "emergency_request_fulfillment_itemId_status_idx" ON "emergency_request_fulfillment"("itemId", "status");

-- CreateIndex
CREATE INDEX "emergency_request_fulfillment_organizationId_status_idx" ON "emergency_request_fulfillment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "emergency_request_fulfillment_offeredById_idx" ON "emergency_request_fulfillment"("offeredById");

-- CreateIndex
CREATE INDEX "emergency_request_fulfillment_respondedById_idx" ON "emergency_request_fulfillment"("respondedById");

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_requestingOrganizationId_fkey" FOREIGN KEY ("requestingOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_item" ADD CONSTRAINT "emergency_request_item_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "emergency_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_fulfillment" ADD CONSTRAINT "emergency_request_fulfillment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "emergency_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_fulfillment" ADD CONSTRAINT "emergency_request_fulfillment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "emergency_request_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_fulfillment" ADD CONSTRAINT "emergency_request_fulfillment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_fulfillment" ADD CONSTRAINT "emergency_request_fulfillment_offeredById_fkey" FOREIGN KEY ("offeredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_fulfillment" ADD CONSTRAINT "emergency_request_fulfillment_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
