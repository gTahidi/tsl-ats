-- Create interview_rooms table
CREATE TABLE IF NOT EXISTS "interview_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"is_active" text DEFAULT 'true',
	CONSTRAINT "interview_rooms_name_unique" UNIQUE("name")
);--> statement-breakpoint

-- Create interviews table
CREATE TABLE IF NOT EXISTS "interviews" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"room_id" text,
	"cal_com_booking_id" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"notes" text,
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interviews_cal_com_booking_id_unique" UNIQUE("cal_com_booking_id")
);--> statement-breakpoint

-- Create interviewers table
CREATE TABLE IF NOT EXISTS "interviewers" (
	"interview_id" text NOT NULL,
	"user_id" text NOT NULL
);--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_room_id_interview_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."interview_rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "interviewers" ADD CONSTRAINT "interviewers_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "interviewers" ADD CONSTRAINT "interviewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Create unique index for interviewers
CREATE UNIQUE INDEX IF NOT EXISTS "interviewers_interview_id_user_id_unique" ON "interviewers" USING btree ("interview_id","user_id");--> statement-breakpoint

-- Insert default interview room
INSERT INTO "interview_rooms" ("id", "name", "location", "is_active") 
VALUES ('default_room_001', 'Virtual Interview Room', 'Google Meet', 'true')
ON CONFLICT ("name") DO NOTHING;
