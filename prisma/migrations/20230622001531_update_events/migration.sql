-- AlterType
ALTER TYPE "EventStatus" RENAME TO "TrialStatus";

-- AlterTable
ALTER TABLE "Event" RENAME COLUMN "status" TO "trialStatus";

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "enableTracks" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_AuditedEvents" (
    "A" BIGINT NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_SortedEvents" (
    "A" BIGINT NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AuditedEvents_AB_unique" ON "_AuditedEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_AuditedEvents_B_index" ON "_AuditedEvents"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SortedEvents_AB_unique" ON "_SortedEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_SortedEvents_B_index" ON "_SortedEvents"("B");

-- AddForeignKey
ALTER TABLE "_AuditedEvents" ADD CONSTRAINT "_AuditedEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditedEvents" ADD CONSTRAINT "_AuditedEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SortedEvents" ADD CONSTRAINT "_SortedEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SortedEvents" ADD CONSTRAINT "_SortedEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
