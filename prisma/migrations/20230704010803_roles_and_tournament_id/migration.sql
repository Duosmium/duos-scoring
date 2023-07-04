/*
  Warnings:

  - You are about to drop the column `isDirector` on the `Role` table. All the data in the column will be lost.
  - The primary key for the `Tournament` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Tournament` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `tournamentId` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tournamentId` on the `Invite` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `role` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tournamentId` on the `Role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tournamentId` on the `Team` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tournamentId` on the `Track` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TD', 'SM', 'ES');

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_tournamentId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "tournamentId",
ADD COLUMN     "tournamentId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "tournamentId",
ADD COLUMN     "tournamentId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "isDirector",
ADD COLUMN     "role" "UserRole" NOT NULL,
DROP COLUMN "tournamentId",
ADD COLUMN     "tournamentId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "tournamentId",
ADD COLUMN     "tournamentId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "tournamentId",
ADD COLUMN     "tournamentId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Role_userId_tournamentId_key" ON "Role"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tournamentId_number_key" ON "Team"("tournamentId", "number");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
