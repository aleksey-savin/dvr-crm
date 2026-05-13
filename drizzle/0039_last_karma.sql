CREATE TABLE "company_counterparty" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"counterparty_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_counterparty_unique" UNIQUE("company_id","counterparty_id")
);
--> statement-breakpoint
CREATE TABLE "counterparty" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"full_name" text,
	"tin" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_counterparty" ADD CONSTRAINT "company_counterparty_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_counterparty" ADD CONSTRAINT "company_counterparty_counterparty_id_counterparty_id_fk" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_counterparty_companyId_idx" ON "company_counterparty" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_counterparty_counterpartyId_idx" ON "company_counterparty" USING btree ("counterparty_id");