CREATE TABLE "client" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"gross_profit_last_year" numeric,
	"target_forecast_current_year" numeric,
	"risks" text,
	"upselling_opportunities" text,
	"client_manager_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-03 05:17:21.003';--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_client_manager_id_user_id_fk" FOREIGN KEY ("client_manager_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_companyId_idx" ON "client" USING btree ("company_id");