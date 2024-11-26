CREATE INDEX IF NOT EXISTS "Event_tournamentId_index" ON "scoring"."Event" USING btree ("tournamentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Score_eventId_index" ON "scoring"."Score" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Score_teamId_index" ON "scoring"."Score" USING btree ("teamId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Team_tournamentId_index" ON "scoring"."Team" USING btree ("tournamentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Track_tournamentId_index" ON "scoring"."Track" USING btree ("tournamentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "_ESEventRoles_A_index" ON "scoring"."_ESEventRoles" USING btree ("A");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "_InviteEvents_A_index" ON "scoring"."_InviteEvents" USING btree ("A");