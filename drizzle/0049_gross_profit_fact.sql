DROP TABLE IF EXISTS "sale_fact" CASCADE;
--> statement-breakpoint
CREATE TABLE "gross_profit_fact" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_id" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"fact_date" date NOT NULL,
	"description" text,
	"manager_user_id" text NOT NULL,
	"department_id" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"external_source" text,
	"external_id" text,
	"matched_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gross_profit_fact" ADD CONSTRAINT "gross_profit_fact_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gross_profit_fact" ADD CONSTRAINT "gross_profit_fact_manager_user_id_user_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gross_profit_fact" ADD CONSTRAINT "gross_profit_fact_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gross_profit_fact_company_account_id_idx" ON "gross_profit_fact" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_fact_date_idx" ON "gross_profit_fact" USING btree ("fact_date");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_manager_user_id_idx" ON "gross_profit_fact" USING btree ("manager_user_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_department_id_idx" ON "gross_profit_fact" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_source_external_id_idx" ON "gross_profit_fact" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_deleted_at_idx" ON "gross_profit_fact" USING btree ("deleted_at");
