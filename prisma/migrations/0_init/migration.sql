-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('COMPETED', 'PARTICIPATION', 'NOSHOW', 'DISQUALIFICATION');

-- CreateEnum
CREATE TYPE "TournamentRoles" AS ENUM ('DIRECTOR', 'LEAD_ES', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "Divisions" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "TournamentLevels" AS ENUM ('INVITATIONAL', 'REGIONAL', 'STATE', 'NATIONAL');

-- CreateEnum
CREATE TYPE "States" AS ENUM ('AL', 'AK', 'AZ', 'AR', 'CA', 'nCA', 'sCA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCORING', 'TRIAL', 'TRIALED');

-- CreateTable
CREATE TABLE "Event" (
    "id" BIGSERIAL NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCORING',
    "highScoring" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "eventId" BIGINT,
    "role" "TournamentRoles" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" BIGSERIAL NOT NULL,
    "teamId" BIGINT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "tier" SMALLINT,
    "tiebreak" REAL,
    "status" "ScoreStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" BIGSERIAL NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "number" SMALLINT NOT NULL,
    "school" TEXT NOT NULL,
    "abbreviation" TEXT,
    "suffix" TEXT,
    "city" TEXT,
    "state" "States" NOT NULL,
    "trackId" BIGINT,
    "exhibition" BOOLEAN NOT NULL DEFAULT false,
    "penalties" SMALLINT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "state" "States" NOT NULL,
    "level" "TournamentLevels" NOT NULL,
    "year" SMALLINT NOT NULL,
    "medals" SMALLINT,
    "trophies" SMALLINT,
    "bids" SMALLINT,
    "drops" SMALLINT,
    "shortName" TEXT,
    "awardsDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "nOffset" SMALLINT,
    "startDate" DATE NOT NULL,
    "division" "Divisions" NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" BIGSERIAL NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "medals" SMALLINT,
    "trophies" SMALLINT,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

