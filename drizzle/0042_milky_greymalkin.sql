CREATE TABLE "company_account_managers" (
	"company_account_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_account_managers_company_account_id_user_id_pk" PRIMARY KEY("company_account_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "company_account_managers" ADD CONSTRAINT "company_account_managers_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_account_managers" ADD CONSTRAINT "company_account_managers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_account_managers_companyAccountId_idx" ON "company_account_managers" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "company_account_managers_userId_idx" ON "company_account_managers" USING btree ("user_id");--> statement-breakpoint
INSERT INTO "company_account_managers" ("company_account_id", "user_id")
SELECT "id", "owner_user_id"
FROM "company_account"
WHERE "owner_user_id" IS NOT NULL
ON CONFLICT DO NOTHING;
