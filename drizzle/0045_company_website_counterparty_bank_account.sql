CREATE TABLE "industry" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "industry_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "industry_id" text;--> statement-breakpoint
INSERT INTO "industry" ("id", "name")
SELECT md5(trim("industry")), trim("industry")
FROM "company"
WHERE "industry" IS NOT NULL AND trim("industry") <> ''
GROUP BY trim("industry")
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
UPDATE "company"
SET "industry_id" = "industry"."id"
FROM "industry"
WHERE "company"."industry" IS NOT NULL
  AND trim("company"."industry") <> ''
  AND trim("company"."industry") = "industry"."name";--> statement-breakpoint
ALTER TABLE "counterparty" ADD COLUMN "bank_account" text;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE set null ON UPDATE no action;
