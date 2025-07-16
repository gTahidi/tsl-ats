CREATE TABLE IF NOT EXISTS "referees" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"organization" text,
	"cv_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "rating" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "personas" ALTER COLUMN "surname" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referees" ADD CONSTRAINT "referees_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
