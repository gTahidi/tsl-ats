ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "start_time" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "end_time" timestamp with time zone;
