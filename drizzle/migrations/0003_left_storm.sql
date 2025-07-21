CREATE TABLE IF NOT EXISTS "legacy_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"phone_no" text,
	"email" text,
	"payment_status" text,
	"gender" text,
	"years_of_experience" text,
	"position_applying_1" text,
	"position_applying_2" text,
	"position_applying_3" text,
	"date_of_receiving_cv" text,
	"highest_education" text,
	"qualifications" text,
	"university_or_institution" text,
	"interviews" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
