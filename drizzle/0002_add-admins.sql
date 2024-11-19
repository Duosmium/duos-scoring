CREATE TABLE IF NOT EXISTS "scoring"."Admins" (
	"userId" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoring"."Admins" ADD CONSTRAINT "Admins_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "scoring"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
