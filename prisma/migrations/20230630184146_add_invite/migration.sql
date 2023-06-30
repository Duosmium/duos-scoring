/*
  Warnings:

  - A unique constraint covering the columns `[eventId,teamId]` on the table `Score` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,number]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Invite" (
    "link" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("link")
);

-- CreateTable
CREATE TABLE "_InviteEvents" (
    "A" BIGINT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InviteEvents_AB_unique" ON "_InviteEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_InviteEvents_B_index" ON "_InviteEvents"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Score_eventId_teamId_key" ON "Score"("eventId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tournamentId_number_key" ON "Team"("tournamentId", "number");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_InviteEvents" ADD CONSTRAINT "_InviteEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InviteEvents" ADD CONSTRAINT "_InviteEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "Invite"("link") ON DELETE CASCADE ON UPDATE CASCADE;
