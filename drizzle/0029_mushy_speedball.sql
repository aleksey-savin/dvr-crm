CREATE TABLE "wishlist_client" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"why" text
);
--> statement-breakpoint
CREATE TABLE "wishlist_client_department" (
	"wishlist_client_id" text NOT NULL,
	"department_id" text NOT NULL,
	CONSTRAINT "wishlist_client_department_wishlist_client_id_department_id_pk" PRIMARY KEY("wishlist_client_id","department_id")
);
--> statement-breakpoint
ALTER TABLE "client_hook" RENAME COLUMN "client_id" TO "wishlist_client_id";--> statement-breakpoint
ALTER TABLE "company_revenue" RENAME COLUMN "company_id" TO "wishlist_client_id";--> statement-breakpoint
ALTER TABLE "client_hook" DROP CONSTRAINT "client_hook_client_id_client_id_fk";
--> statement-breakpoint
ALTER TABLE "company_revenue" DROP CONSTRAINT "company_revenue_company_id_company_id_fk";
--> statement-breakpoint
DROP INDEX "client_hook_clientId_idx";--> statement-breakpoint
DROP INDEX "company_revenue_companyId_idx";--> statement-breakpoint
DROP INDEX "company_revenue_companyId_year_idx";--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 13:33:35.874';--> statement-breakpoint
ALTER TABLE "wishlist_client" ADD CONSTRAINT "wishlist_client_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_client_department" ADD CONSTRAINT "wishlist_client_department_wishlist_client_id_wishlist_client_id_fk" FOREIGN KEY ("wishlist_client_id") REFERENCES "public"."wishlist_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_client_department" ADD CONSTRAINT "wishlist_client_department_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wishlist_client_companyId_idx" ON "wishlist_client" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "wishlist_client_dept_wishlistClientId_idx" ON "wishlist_client_department" USING btree ("wishlist_client_id");--> statement-breakpoint
CREATE INDEX "wishlist_client_dept_departmentId_idx" ON "wishlist_client_department" USING btree ("department_id");--> statement-breakpoint
ALTER TABLE "client_hook" ADD CONSTRAINT "client_hook_wishlist_client_id_wishlist_client_id_fk" FOREIGN KEY ("wishlist_client_id") REFERENCES "public"."wishlist_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_revenue" ADD CONSTRAINT "company_revenue_wishlist_client_id_wishlist_client_id_fk" FOREIGN KEY ("wishlist_client_id") REFERENCES "public"."wishlist_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_hook_wishlistClientId_idx" ON "client_hook" USING btree ("wishlist_client_id");--> statement-breakpoint
CREATE INDEX "company_revenue_wishlistClientId_idx" ON "company_revenue" USING btree ("wishlist_client_id");--> statement-breakpoint
CREATE INDEX "company_revenue_wishlistClientId_year_idx" ON "company_revenue" USING btree ("wishlist_client_id","year");--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "wishlist";