CREATE TABLE "company_account_departments" (
	"company_account_id" text NOT NULL,
	"department_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_account_departments_company_account_id_department_id_pk" PRIMARY KEY("company_account_id","department_id")
);
--> statement-breakpoint
ALTER TABLE "company_account_departments" ADD CONSTRAINT "company_account_departments_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_account_departments" ADD CONSTRAINT "company_account_departments_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_account_departments_companyAccountId_idx" ON "company_account_departments" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "company_account_departments_departmentId_idx" ON "company_account_departments" USING btree ("department_id");
--> statement-breakpoint
INSERT INTO "company_account_departments" ("company_account_id", "department_id")
SELECT "id", "business_unit_id"
FROM "company_account"
WHERE "account_type" = 'wishlist'
ON CONFLICT DO NOTHING;
