CREATE TABLE "company_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"description" text,
	"contacts" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_hooks" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 08:12:24.770';--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "regional_market_position" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "why" text;--> statement-breakpoint
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_hooks" ADD CONSTRAINT "company_hooks_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_contacts_companyId_idx" ON "company_contacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_hooks_companyId_idx" ON "company_hooks" USING btree ("company_id");