/*
  Warnings:

  - You are about to drop the `_SortedEvents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SortedEvents" DROP CONSTRAINT "_SortedEvents_A_fkey";

-- DropForeignKey
ALTER TABLE "_SortedEvents" DROP CONSTRAINT "_SortedEvents_B_fkey";

-- DropTable
DROP TABLE "_SortedEvents";
