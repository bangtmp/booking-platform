-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "breakStart" TEXT,
ADD COLUMN "breakEnd" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_staffId_dayOfWeek_key" ON "Schedule"("staffId", "dayOfWeek");
