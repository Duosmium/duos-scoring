CREATE SCHEMA "scoring";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scoring"."Divisions" AS ENUM('A', 'B', 'C');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scoring"."ScoreStatus" AS ENUM('COMPETED', 'PARTICIPATION', 'NOSHOW', 'DISQUALIFICATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scoring"."States" AS ENUM('AL', 'AK', 'AZ', 'AR', 'CA', 'nCA', 'sCA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'INTERNATIONAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scoring"."TournamentLevels" AS ENUM('INVITATIONAL', 'REGIONAL', 'STATE', 'NATIONAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scoring"."TrialStatus" AS ENUM('SCORING', 'TRIAL', 'TRIALED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scoring"."UserRole" AS ENUM('TD', 'SM', 'ES');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trialStatus" "scoring"."TrialStatus" DEFAULT 'SCORING' NOT NULL,
	"highScoring" boolean DEFAULT true NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"medals" smallint,
	"auditedUserId" uuid,
	"auditedAt" timestamp(3) with time zone,
	"tournamentId" bigint NOT NULL,
	"lastExportedAt" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Invite" (
	"link" text PRIMARY KEY NOT NULL,
	"email" text,
	"tournamentId" bigint NOT NULL,
	"role" "scoring"."UserRole" DEFAULT 'ES' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Role" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"role" "scoring"."UserRole" NOT NULL,
	"tournamentId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Score" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"teamId" bigint NOT NULL,
	"eventId" bigint NOT NULL,
	"rawScore" double precision,
	"tier" smallint,
	"tiebreak" real,
	"status" "scoring"."ScoreStatus" NOT NULL,
	"notes" text,
	"checklist" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Slides" (
	"tournamentId" bigint NOT NULL,
	"channelId" text,
	"settings" jsonb,
	"batches" jsonb,
	"done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Team" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"number" smallint NOT NULL,
	"school" text NOT NULL,
	"abbreviation" text,
	"suffix" text,
	"city" text,
	"state" "scoring"."States" NOT NULL,
	"trackId" bigint,
	"exhibition" boolean DEFAULT false NOT NULL,
	"penalties" smallint,
	"tournamentId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Tournament" (
	"name" text NOT NULL,
	"location" text NOT NULL,
	"state" "scoring"."States" NOT NULL,
	"level" "scoring"."TournamentLevels" NOT NULL,
	"year" smallint NOT NULL,
	"medals" smallint DEFAULT 6 NOT NULL,
	"trophies" smallint DEFAULT 3 NOT NULL,
	"bids" smallint,
	"drops" smallint,
	"shortName" text,
	"awardsDate" date NOT NULL,
	"endDate" date NOT NULL,
	"nOffset" smallint,
	"startDate" date NOT NULL,
	"division" "scoring"."Divisions" NOT NULL,
	"enableTracks" boolean DEFAULT false NOT NULL,
	"id" bigserial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."Track" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"medals" smallint,
	"trophies" smallint,
	"tournamentId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."User" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."_ESEventRoles" (
	"A" bigint NOT NULL,
	"B" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring"."_InviteEvents" (
	"A" bigint NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Event" ADD CONSTRAINT "Event_auditedUserId_User_id_fk" FOREIGN KEY ("auditedUserId") REFERENCES "scoring"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Event" ADD CONSTRAINT "Event_tournamentId_Tournament_id_fk" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Invite" ADD CONSTRAINT "Invite_tournamentId_Tournament_id_fk" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Role" ADD CONSTRAINT "Role_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "scoring"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Role" ADD CONSTRAINT "Role_tournamentId_Tournament_id_fk" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Score" ADD CONSTRAINT "Score_teamId_Team_id_fk" FOREIGN KEY ("teamId") REFERENCES "scoring"."Team"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Score" ADD CONSTRAINT "Score_eventId_Event_id_fk" FOREIGN KEY ("eventId") REFERENCES "scoring"."Event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Slides" ADD CONSTRAINT "Slides_tournamentId_Tournament_id_fk" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Team" ADD CONSTRAINT "Team_trackId_Track_id_fk" FOREIGN KEY ("trackId") REFERENCES "scoring"."Track"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Team" ADD CONSTRAINT "Team_tournamentId_Tournament_id_fk" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Track" ADD CONSTRAINT "Track_tournamentId_Tournament_id_fk" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."_ESEventRoles" ADD CONSTRAINT "_ESEventRoles_A_Event_id_fk" FOREIGN KEY ("A") REFERENCES "scoring"."Event"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."_ESEventRoles" ADD CONSTRAINT "_ESEventRoles_B_Role_id_fk" FOREIGN KEY ("B") REFERENCES "scoring"."Role"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."_InviteEvents" ADD CONSTRAINT "_InviteEvents_A_Event_id_fk" FOREIGN KEY ("A") REFERENCES "scoring"."Event"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."_InviteEvents" ADD CONSTRAINT "_InviteEvents_B_Invite_link_fk" FOREIGN KEY ("B") REFERENCES "scoring"."Invite"("link") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Role_userId_tournamentId_key" ON "scoring"."Role" USING btree ("userId","tournamentId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Score_eventId_teamId_key" ON "scoring"."Score" USING btree ("eventId","teamId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Slides_tournamentId_key" ON "scoring"."Slides" USING btree ("tournamentId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Team_tournamentId_number_key" ON "scoring"."Team" USING btree ("tournamentId","number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "_ESEventRoles_AB_unique" ON "scoring"."_ESEventRoles" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "_ESEventRoles_B_index" ON "scoring"."_ESEventRoles" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "_InviteEvents_AB_unique" ON "scoring"."_InviteEvents" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "_InviteEvents_B_index" ON "scoring"."_InviteEvents" USING btree ("B");