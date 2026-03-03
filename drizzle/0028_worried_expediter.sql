ALTER TABLE "company_hooks" RENAME TO "client_hook";--> statement-breakpoint
ALTER TABLE "company_contacts" RENAME TO "company_contact";--> statement-breakpoint
ALTER TABLE "client_hook" RENAME COLUMN "company_id" TO "client_id";--> statement-breakpoint
ALTER TABLE "company_contact" DROP CONSTRAINT "company_contacts_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "client_hook" DROP CONSTRAINT "company_hooks_company_id_company_id_fk";
--> statement-breakpoint
DROP INDEX "company_hooks_companyId_idx";--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 08:20:11.140';--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "why" text;--> statement-breakpoint
ALTER TABLE "company_contact" ADD CONSTRAINT "company_contact_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_hook" ADD CONSTRAINT "client_hook_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_hook_clientId_idx" ON "client_hook" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "why";