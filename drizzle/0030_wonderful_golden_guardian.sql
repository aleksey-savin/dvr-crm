ALTER TABLE "company_revenue" RENAME COLUMN "wishlist_client_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "company_revenue" DROP CONSTRAINT "company_revenue_wishlist_client_id_wishlist_client_id_fk";
--> statement-breakpoint
DROP INDEX "company_revenue_wishlistClientId_idx";--> statement-breakpoint
DROP INDEX "company_revenue_wishlistClientId_year_idx";--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 13:58:14.687';--> statement-breakpoint
ALTER TABLE "company_revenue" ADD CONSTRAINT "company_revenue_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_revenue_companyId_idx" ON "company_revenue" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_revenue_companyId_year_idx" ON "company_revenue" USING btree ("company_id","year");