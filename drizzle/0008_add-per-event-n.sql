CREATE TYPE "scoring"."PerEventNOptions" AS ENUM('NONE', 'PLACE', 'PARTICIPATION');--> statement-breakpoint
ALTER TABLE "scoring"."Tournament" ADD COLUMN "perEventN" "scoring"."PerEventNOptions" DEFAULT 'NONE' NOT NULL;