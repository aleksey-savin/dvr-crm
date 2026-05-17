CREATE TABLE "contact_role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_role_name_unique" UNIQUE("name")
);
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
CREATE TABLE "initiative" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"pipeline_id" text,
	"stage_id" text,
	"company_account_id" text,
	"company_id" text,
	"department_id" text,
	"responsible_user_id" text,
	"budget" numeric(15, 2),
	"description" text,
	"due_date" date,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_lead_id" text,
	"source_signal_id" text,
	"refusal_reason_id" text,
	"closed_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_department" (
	"pipeline_id" text NOT NULL,
	"department_id" text NOT NULL,
	CONSTRAINT "pipeline_department_pipeline_id_department_id_pk" PRIMARY KEY("pipeline_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_won" boolean DEFAULT false NOT NULL,
	"is_lost" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"initiative_id" text NOT NULL,
	"title" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"proposal_type" text,
	"amount" numeric(15, 2),
	"valid_until" date,
	"is_current" boolean DEFAULT false NOT NULL,
	"description" text,
	"sender_user_id" text,
	"prepared_at" timestamp,
	"sent_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refusal_reason" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refusal_reason_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "signal_type" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signal_type_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "source_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "lead" RENAME COLUMN "source" TO "source_id";--> statement-breakpoint
ALTER TABLE "lead" RENAME COLUMN "lost_reason" TO "lost_reason_id";--> statement-breakpoint
ALTER TABLE "signal" RENAME COLUMN "signal_type" TO "signal_type_id";--> statement-breakpoint
ALTER TABLE "tender" RENAME COLUMN "lost_reason" TO "lost_reason_id";--> statement-breakpoint
ALTER TABLE "company_contact" ADD COLUMN "contact_role_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "initiative_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "rescheduled_from_meeting_id" text;--> statement-breakpoint
ALTER TABLE "target_action" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "target_action" ADD COLUMN "proposal_id" text;--> statement-breakpoint
ALTER TABLE "gross_profit_fact" ADD CONSTRAINT "gross_profit_fact_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gross_profit_fact" ADD CONSTRAINT "gross_profit_fact_manager_user_id_user_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gross_profit_fact" ADD CONSTRAINT "gross_profit_fact_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_pipeline_id_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_company_account_id_company_account_id_fk" FOREIGN KEY ("company_account_id") REFERENCES "public"."company_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_responsible_user_id_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_source_lead_id_lead_id_fk" FOREIGN KEY ("source_lead_id") REFERENCES "public"."lead"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_source_signal_id_signal_id_fk" FOREIGN KEY ("source_signal_id") REFERENCES "public"."signal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_refusal_reason_id_refusal_reason_id_fk" FOREIGN KEY ("refusal_reason_id") REFERENCES "public"."refusal_reason"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_department" ADD CONSTRAINT "pipeline_department_pipeline_id_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_department" ADD CONSTRAINT "pipeline_department_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stage" ADD CONSTRAINT "pipeline_stage_pipeline_id_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_initiative_id_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiative"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gross_profit_fact_company_account_id_idx" ON "gross_profit_fact" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_fact_date_idx" ON "gross_profit_fact" USING btree ("fact_date");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_manager_user_id_idx" ON "gross_profit_fact" USING btree ("manager_user_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_department_id_idx" ON "gross_profit_fact" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_source_external_id_idx" ON "gross_profit_fact" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "gross_profit_fact_deleted_at_idx" ON "gross_profit_fact" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "initiative_pipeline_id_idx" ON "initiative" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "initiative_stage_id_idx" ON "initiative" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "initiative_pipeline_stage_idx" ON "initiative" USING btree ("pipeline_id","stage_id");--> statement-breakpoint
CREATE INDEX "initiative_company_account_id_idx" ON "initiative" USING btree ("company_account_id");--> statement-breakpoint
CREATE INDEX "initiative_company_id_idx" ON "initiative" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "initiative_department_id_idx" ON "initiative" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "initiative_responsible_user_id_idx" ON "initiative" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE INDEX "initiative_source_lead_id_idx" ON "initiative" USING btree ("source_lead_id");--> statement-breakpoint
CREATE INDEX "initiative_source_signal_id_idx" ON "initiative" USING btree ("source_signal_id");--> statement-breakpoint
CREATE INDEX "initiative_deleted_at_idx" ON "initiative" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "initiative_closed_at_idx" ON "initiative" USING btree ("closed_at");--> statement-breakpoint
CREATE INDEX "pipeline_department_pipeline_id_idx" ON "pipeline_department" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "pipeline_department_department_id_idx" ON "pipeline_department" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "pipeline_stage_pipeline_id_idx" ON "pipeline_stage" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "pipeline_stage_pipeline_id_order_idx" ON "pipeline_stage" USING btree ("pipeline_id","order");--> statement-breakpoint
CREATE INDEX "proposal_initiative_id_idx" ON "proposal" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "proposal_status_idx" ON "proposal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposal_deleted_at_idx" ON "proposal" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "company_contact" ADD CONSTRAINT "company_contact_contact_role_id_contact_role_id_fk" FOREIGN KEY ("contact_role_id") REFERENCES "public"."contact_role"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_lost_reason_id_refusal_reason_id_fk" FOREIGN KEY ("lost_reason_id") REFERENCES "public"."refusal_reason"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_initiative_id_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiative"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_rescheduled_from_meeting_id_meeting_id_fk" FOREIGN KEY ("rescheduled_from_meeting_id") REFERENCES "public"."meeting"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_signal_type_id_signal_type_id_fk" FOREIGN KEY ("signal_type_id") REFERENCES "public"."signal_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_initiative_id_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiative"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_lost_reason_id_refusal_reason_id_fk" FOREIGN KEY ("lost_reason_id") REFERENCES "public"."refusal_reason"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_contacts_contactRoleId_idx" ON "company_contact" USING btree ("contact_role_id");--> statement-breakpoint
CREATE INDEX "lead_source_id_idx" ON "lead" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "lead_lost_reason_id_idx" ON "lead" USING btree ("lost_reason_id");--> statement-breakpoint
CREATE INDEX "meeting_initiative_id_idx" ON "meeting" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "meeting_rescheduled_from_meeting_id_idx" ON "meeting" USING btree ("rescheduled_from_meeting_id");--> statement-breakpoint
CREATE INDEX "signal_signal_type_id_idx" ON "signal" USING btree ("signal_type_id");--> statement-breakpoint
CREATE INDEX "target_action_initiative_id_idx" ON "target_action" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "target_action_proposal_id_idx" ON "target_action" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "tender_lost_reason_id_idx" ON "tender" USING btree ("lost_reason_id");