/*
  Warnings:

  - You are about to drop the column `eventId` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Role` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,tournamentId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_eventId_fkey";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "eventId",
DROP COLUMN "role",
ADD COLUMN     "isDirector" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "TournamentRoles";

-- CreateTable
CREATE TABLE "_ESEventRoles" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ESEventRoles_AB_unique" ON "_ESEventRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_ESEventRoles_B_index" ON "_ESEventRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Role_userId_tournamentId_key" ON "Role"("userId", "tournamentId");

-- AddForeignKey
ALTER TABLE "_ESEventRoles" ADD CONSTRAINT "_ESEventRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ESEventRoles" ADD CONSTRAINT "_ESEventRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
