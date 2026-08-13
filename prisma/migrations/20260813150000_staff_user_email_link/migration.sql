-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "userEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_tenantId_userEmail_key" ON "Staff"("tenantId", "userEmail");
