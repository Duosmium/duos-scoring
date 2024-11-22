ALTER TABLE "scoring"."Event" DROP CONSTRAINT "Event_auditedUserId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "scoring"."Event" ADD COLUMN "enableChecklist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Event" ADD CONSTRAINT "Event_auditedUserId_User_id_fk" FOREIGN KEY ("auditedUserId") REFERENCES "scoring"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
