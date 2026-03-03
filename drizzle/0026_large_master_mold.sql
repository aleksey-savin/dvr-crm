CREATE TABLE "company_revenue" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 08:06:23.572';--> statement-breakpoint
ALTER TABLE "company_revenue" ADD CONSTRAINT "company_revenue_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_revenue_companyId_idx" ON "company_revenue" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_revenue_companyId_year_idx" ON "company_revenue" USING btree ("company_id","year");