-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "scoring";

-- CreateEnum
CREATE TYPE "scoring"."UserRole" AS ENUM ('TD', 'SM', 'ES');

-- CreateEnum
CREATE TYPE "scoring"."ScoreStatus" AS ENUM ('COMPETED', 'PARTICIPATION', 'NOSHOW', 'DISQUALIFICATION');

-- CreateEnum
CREATE TYPE "scoring"."Divisions" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "scoring"."TournamentLevels" AS ENUM ('INVITATIONAL', 'REGIONAL', 'STATE', 'NATIONAL');

-- CreateEnum
CREATE TYPE "scoring"."States" AS ENUM ('AL', 'AK', 'AZ', 'AR', 'CA', 'nCA', 'sCA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "scoring"."TrialStatus" AS ENUM ('SCORING', 'TRIAL', 'TRIALED');

-- CreateTable
CREATE TABLE "scoring"."Event" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trialStatus" "scoring"."TrialStatus" NOT NULL DEFAULT 'SCORING',
    "highScoring" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "medals" SMALLINT,
    "auditedUserId" UUID,
    "auditedAt" TIMESTAMPTZ(3),
    "tournamentId" BIGINT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."Role" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "role" "scoring"."UserRole" NOT NULL,
    "tournamentId" BIGINT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."Score" (
    "id" BIGSERIAL NOT NULL,
    "teamId" BIGINT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "tier" SMALLINT,
    "tiebreak" REAL,
    "status" "scoring"."ScoreStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."Team" (
    "id" BIGSERIAL NOT NULL,
    "number" SMALLINT NOT NULL,
    "school" TEXT NOT NULL,
    "abbreviation" TEXT,
    "suffix" TEXT,
    "city" TEXT,
    "state" "scoring"."States" NOT NULL,
    "trackId" BIGINT,
    "exhibition" BOOLEAN NOT NULL DEFAULT false,
    "penalties" SMALLINT,
    "tournamentId" BIGINT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."Tournament" (
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "state" "scoring"."States" NOT NULL,
    "level" "scoring"."TournamentLevels" NOT NULL,
    "year" SMALLINT NOT NULL,
    "medals" SMALLINT NOT NULL DEFAULT 6,
    "trophies" SMALLINT NOT NULL DEFAULT 3,
    "bids" SMALLINT,
    "drops" SMALLINT,
    "shortName" TEXT,
    "awardsDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "nOffset" SMALLINT,
    "startDate" DATE NOT NULL,
    "division" "scoring"."Divisions" NOT NULL,
    "enableTracks" BOOLEAN NOT NULL DEFAULT false,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."Track" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "medals" SMALLINT,
    "trophies" SMALLINT,
    "tournamentId" BIGINT NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring"."Invite" (
    "link" TEXT NOT NULL,
    "email" TEXT,
    "tournamentId" BIGINT NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("link")
);

-- CreateTable
CREATE TABLE "scoring"."_ESEventRoles" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "scoring"."_InviteEvents" (
    "A" BIGINT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_userId_tournamentId_key" ON "scoring"."Role"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_eventId_teamId_key" ON "scoring"."Score"("eventId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tournamentId_number_key" ON "scoring"."Team"("tournamentId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "_ESEventRoles_AB_unique" ON "scoring"."_ESEventRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_ESEventRoles_B_index" ON "scoring"."_ESEventRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_InviteEvents_AB_unique" ON "scoring"."_InviteEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_InviteEvents_B_index" ON "scoring"."_InviteEvents"("B");

-- AddForeignKey
ALTER TABLE "scoring"."Event" ADD CONSTRAINT "Event_auditedUserId_fkey" FOREIGN KEY ("auditedUserId") REFERENCES "scoring"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Event" ADD CONSTRAINT "Event_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Role" ADD CONSTRAINT "Role_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "scoring"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Score" ADD CONSTRAINT "Score_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "scoring"."Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Score" ADD CONSTRAINT "Score_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "scoring"."Team"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Team" ADD CONSTRAINT "Team_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "scoring"."Track"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Track" ADD CONSTRAINT "Track_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."Invite" ADD CONSTRAINT "Invite_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scoring"."_ESEventRoles" ADD CONSTRAINT "_ESEventRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "scoring"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring"."_ESEventRoles" ADD CONSTRAINT "_ESEventRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "scoring"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring"."_InviteEvents" ADD CONSTRAINT "_InviteEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "scoring"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring"."_InviteEvents" ADD CONSTRAINT "_InviteEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "scoring"."Invite"("link") ON DELETE CASCADE ON UPDATE CASCADE;

