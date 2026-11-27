-- AlterTable
ALTER TABLE "user" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");
