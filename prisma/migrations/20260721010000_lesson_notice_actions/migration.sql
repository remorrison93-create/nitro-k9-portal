-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LessonStatus" ADD VALUE 'FORFEITED';
ALTER TYPE "LessonStatus" ADD VALUE 'RESCHEDULED';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "rescheduledToId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_rescheduledToId_key" ON "Lesson"("rescheduledToId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_rescheduledToId_fkey" FOREIGN KEY ("rescheduledToId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

