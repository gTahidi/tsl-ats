ALTER TABLE "candidates" ALTER COLUMN "qualified" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "qualified" SET DATA TYPE boolean USING "qualified"::boolean;--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "qualified" SET DEFAULT false;