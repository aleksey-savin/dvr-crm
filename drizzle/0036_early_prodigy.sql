CREATE TABLE "account_gross_profits" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_id" text NOT NULL,
	"year" integer NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_hooks" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_risks" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_target_forecasts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_id" text NOT NULL,
	"year" integer NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_upselling_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_account" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"business_unit_id" text NOT NULL,
	"account_type" text DEFAULT 'client' NOT NULL,
	"is_target" boolean DEFAULT false NOT NULL,
	"position" integer,
	"is_lost" boolean DEFAULT false NOT NULL,
	"lost_reasons" text,
	"wishlist_state" text,
	"owner_user_id" text,
	"why" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_gross_profits" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_hook" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_managers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_risks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_target_forecasts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_upselling_opportunities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wishlist_client" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wishlist_client_department" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wishlist_client_responsible_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "client" CASCADE;--> statement-breakpoint
DROP TABLE "client_gross_profits" CASCADE;--> statement-breakpoint
DROP TABLE "client_hook" CASCADE;--> statement-breakpoint
DROP TABLE "client_managers" CASCADE;--> statement-breakpoint
DROP TABLE "client_risks" CASCADE;--> statement-breakpoint
DROP TABLE "client_target_forecasts" CASCADE;--> statement-breakpoint
DROP TABLE "client_upselling_opportunities" CASCADE;--> statement-breakpoint
DROP TABLE "wishlist_client" CASCADE;--> statement-breakpoint
DROP TABLE "wishlist_client_department" CASCADE;--> statement-breakpoint
DROP TABLE "wishlist_client_responsible_users" CASCADE;--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_client_id_client_id_fk";
--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_wishlist_client_id_wishlist_client_id_fk";
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-05-14 09:09:30.130';--> statement-breakpoint
ALTER TABLE "department" ADD COLUMN "head_user_id" text;--> statement-breakpoint
ALTER TABLE "department" ADD COLUMN "parent_department_id" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "company_account_id" text;--> statement-breakpoint
ALTER TABLE "account_gross_profits" ADD CONSTRAINT "account_gross_profits_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_hooks" ADD CONSTRAINT "account_hooks_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_risks" ADD CONSTRAINT "account_risks_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_target_forecasts" ADD CONSTRAINT "account_target_forecasts_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_upselling_opportunities" ADD CONSTRAINT "account_upselling_opportunities_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_account" ADD CONSTRAINT "company_account_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_account" ADD CONSTRAINT "company_account_business_unit_id_department_id_fk" FOREIGN KEY ("business_unit_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_account" ADD CONSTRAINT "company_account_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_gross_profits_companyAccountId_idx" ON "account_gross_profits" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "account_gross_profits_companyAccountId_year_idx" ON "account_gross_profits" USING btree ("company_account_id","year");--> statement-breakpoint
CREATE INDEX "account_hooks_companyAccountId_idx" ON "account_hooks" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "account_risks_companyAccountId_idx" ON "account_risks" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "account_target_forecasts_companyAccountId_idx" ON "account_target_forecasts" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "account_target_forecasts_companyAccountId_year_idx" ON "account_target_forecasts" USING btree ("company_account_id","year");--> statement-breakpoint
CREATE INDEX "account_upselling_opportunities_companyAccountId_idx" ON "account_upselling_opportunities" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "company_account_companyId_idx" ON "company_account" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_account_businessUnitId_idx" ON "company_account" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "company_account_accountType_idx" ON "company_account" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "company_account_ownerUserId_idx" ON "company_account" USING btree ("owner_user_id");--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_head_user_id_user_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_parent_department_id_department_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "department_head_user_id_idx" ON "department" USING btree ("head_user_id");--> statement-breakpoint
CREATE INDEX "department_parent_id_idx" ON "department" USING btree ("parent_department_id");--> statement-breakpoint
ALTER TABLE "todos" DROP COLUMN "client_id";--> statement-breakpoint
ALTER TABLE "todos" DROP COLUMN "wishlist_client_id";