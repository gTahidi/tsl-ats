ALTER TABLE "referees" ADD COLUMN "candidate_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referees" ADD CONSTRAINT "referees_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
