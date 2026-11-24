-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IncidentParticipantStatus" ADD VALUE 'REJECTED';
ALTER TYPE "IncidentParticipantStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "incident_participant" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "invitedById" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedById" TEXT;

-- CreateIndex
CREATE INDEX "incident_participant_invitedById_idx" ON "incident_participant"("invitedById");

-- CreateIndex
CREATE INDEX "incident_participant_respondedById_idx" ON "incident_participant"("respondedById");

-- CreateIndex
CREATE INDEX "incident_participant_status_expiresAt_idx" ON "incident_participant"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "incident_participant" ADD CONSTRAINT "incident_participant_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_participant" ADD CONSTRAINT "incident_participant_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
