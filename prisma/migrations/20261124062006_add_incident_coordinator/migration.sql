-- AlterTable
ALTER TABLE "incident" ADD COLUMN     "coordinatorId" TEXT;

-- CreateIndex
CREATE INDEX "incident_coordinatorId_idx" ON "incident"("coordinatorId");

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
