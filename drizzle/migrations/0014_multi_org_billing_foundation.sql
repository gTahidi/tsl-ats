CREATE TABLE IF NOT EXISTS "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"website_url" text,
	"billing_email" text,
	"subscription_status" text DEFAULT 'trialing' NOT NULL,
	"subscription_plan" text DEFAULT 'starter' NOT NULL,
	"trial_ends_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

INSERT INTO "organizations" (
	"id",
	"name",
	"slug",
	"subscription_status",
	"subscription_plan"
)
VALUES (
	'tsl-default-org',
	'JobHuntly',
	'tsl',
	'active',
	'internal'
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "organization_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text DEFAULT 'stub' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"plan" text DEFAULT 'starter' NOT NULL,
	"status" text DEFAULT 'trialing' NOT NULL,
	"current_period_ends_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "organization_subscriptions_org_unique"
	ON "organization_subscriptions" ("organization_id");
--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "process_groups" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "process_step_templates" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "cvs" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "interview_rooms" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "organization_id" text DEFAULT 'tsl-default-org' NOT NULL;
--> statement-breakpoint

ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_name_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "roles_name_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_org_name_unique"
	ON "roles" ("organization_id", "name");
--> statement-breakpoint

ALTER TABLE "personas" DROP CONSTRAINT IF EXISTS "personas_email_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "personas_email_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "personas_org_email_unique"
	ON "personas" ("organization_id", "email");
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personas" ADD CONSTRAINT "personas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "process_groups" ADD CONSTRAINT "process_groups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "process_step_templates" ADD CONSTRAINT "process_step_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "process_steps" ADD CONSTRAINT "process_steps_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cvs" ADD CONSTRAINT "cvs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_rooms" ADD CONSTRAINT "interview_rooms_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
