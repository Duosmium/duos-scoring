-- CreateTable
CREATE TABLE "_UserTournaments" (
    "A" TEXT NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserTournaments_AB_unique" ON "_UserTournaments"("A", "B");

-- CreateIndex
CREATE INDEX "_UserTournaments_B_index" ON "_UserTournaments"("B");

-- AddForeignKey
ALTER TABLE "_UserTournaments" ADD CONSTRAINT "_UserTournaments_A_fkey" FOREIGN KEY ("A") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserTournaments" ADD CONSTRAINT "_UserTournaments_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
