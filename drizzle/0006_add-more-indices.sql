DROP INDEX IF EXISTS "Slides_tournamentId_key";--> statement-breakpoint
ALTER TABLE "scoring"."Slides" ADD PRIMARY KEY ("tournamentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Event_auditedUserId_index" ON "scoring"."Event" USING btree ("auditedUserId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Invite_tournamentId_index" ON "scoring"."Invite" USING btree ("tournamentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Role_userId_index" ON "scoring"."Role" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Role_tournamentId_index" ON "scoring"."Role" USING btree ("tournamentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Team_trackId_index" ON "scoring"."Team" USING btree ("trackId");