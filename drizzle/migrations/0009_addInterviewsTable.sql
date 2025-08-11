DO $$ BEGIN
 CREATE TYPE "public"."interview_status" AS ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "status" "interview_status" DEFAULT 'Scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "scheduled_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "meeting_url" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "candidate_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "job_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN IF EXISTS "application_id";--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN IF EXISTS "start_time";--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN IF EXISTS "end_time";