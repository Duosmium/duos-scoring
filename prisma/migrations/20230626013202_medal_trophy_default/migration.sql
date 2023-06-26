/*
  Warnings:

  - Made the column `medals` on table `Tournament` required. This step will fail if there are existing NULL values in that column.
  - Made the column `trophies` on table `Tournament` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "medals" SET NOT NULL,
ALTER COLUMN "medals" SET DEFAULT 6,
ALTER COLUMN "trophies" SET NOT NULL,
ALTER COLUMN "trophies" SET DEFAULT 3;
