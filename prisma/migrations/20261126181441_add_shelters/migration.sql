/*
  SHELTERS
  Add Shelter model with ShelterStatus enum.

  Additive migration. Existing M4/M5/M6 tables, columns, enums, indexes,
  foreign keys, and raw SQL CHECK constraints are left untouched.

  Tenant integrity is enforced by the organizationId foreign key on
  shelter, ensuring every shelter belongs to exactly one provider
  organization.

  Database CHECK constraints enforce:
    - capacity must be positive (> 0)
    - currentOccupancy must be non-negative (>= 0)
    - currentOccupancy must not exceed capacity (<= capacity)
*/

-- CreateEnum
CREATE TYPE "ShelterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "shelter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "status" "ShelterStatus" NOT NULL DEFAULT 'ACTIVE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shelter_organizationId_idx" ON "shelter"("organizationId");

-- CreateIndex
CREATE INDEX "shelter_organizationId_status_idx" ON "shelter"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "shelter" ADD CONSTRAINT "shelter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK constraints for capacity and occupancy invariants
ALTER TABLE "shelter" ADD CONSTRAINT "shelter_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "shelter" ADD CONSTRAINT "shelter_occupancy_nonnegative" CHECK ("currentOccupancy" >= 0);
ALTER TABLE "shelter" ADD CONSTRAINT "shelter_occupancy_not_exceed_capacity" CHECK ("currentOccupancy" <= "capacity");
