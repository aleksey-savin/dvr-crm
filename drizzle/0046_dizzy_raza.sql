CREATE TABLE "lead" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company_id" text,
	"department_id" text,
	"responsible_user_id" text,
	"industry_id" text,
	"source" text,
	"status" text DEFAULT 'new' NOT NULL,
	"budget" numeric(15, 2),
	"description" text,
	"due_date" date,
	"lost_reason" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company_id" text,
	"department_id" text,
	"responsible_user_id" text,
	"industry_id" text,
	"signal_type" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"rating" smallint,
	"description" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tender" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company_id" text,
	"department_id" text,
	"responsible_user_id" text,
	"approver_user_id" text,
	"industry_id" text,
	"status" text DEFAULT 'new' NOT NULL,
	"amount" numeric(15, 2),
	"description" text,
	"deadline" date,
	"platform" text,
	"url" text,
	"lost_reason" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_responsible_user_id_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_responsible_user_id_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_responsible_user_id_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_approver_user_id_user_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_company_id_idx" ON "lead" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "lead_department_id_idx" ON "lead" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "lead_responsible_user_id_idx" ON "lead" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE INDEX "lead_industry_id_idx" ON "lead" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "lead_status_idx" ON "lead" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_deleted_at_idx" ON "lead" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "signal_company_id_idx" ON "signal" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "signal_department_id_idx" ON "signal" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "signal_responsible_user_id_idx" ON "signal" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE INDEX "signal_industry_id_idx" ON "signal" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "signal_status_idx" ON "signal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signal_deleted_at_idx" ON "signal" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "tender_company_id_idx" ON "tender" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tender_department_id_idx" ON "tender" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "tender_responsible_user_id_idx" ON "tender" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE INDEX "tender_approver_user_id_idx" ON "tender" USING btree ("approver_user_id");--> statement-breakpoint
CREATE INDEX "tender_industry_id_idx" ON "tender" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "tender_status_idx" ON "tender" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tender_deleted_at_idx" ON "tender" USING btree ("deleted_at");