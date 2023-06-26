-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medals" SMALLINT;
