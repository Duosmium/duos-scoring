/*
  Warnings:

  - You are about to drop the `_AuditedEvents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AuditedEvents" DROP CONSTRAINT "_AuditedEvents_A_fkey";

-- DropForeignKey
ALTER TABLE "_AuditedEvents" DROP CONSTRAINT "_AuditedEvents_B_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "auditedUserId" UUID;

-- DropTable
DROP TABLE "_AuditedEvents";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_auditedUserId_fkey" FOREIGN KEY ("auditedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
