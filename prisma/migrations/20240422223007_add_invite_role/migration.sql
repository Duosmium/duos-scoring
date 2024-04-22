-- AlterTable
ALTER TABLE "scoring"."Invite" ADD COLUMN     "role" "scoring"."UserRole" NOT NULL DEFAULT 'ES';
