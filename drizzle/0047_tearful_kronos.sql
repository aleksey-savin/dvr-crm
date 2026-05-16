CREATE TABLE "meeting_external_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_participant" (
	"meeting_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "meeting_participant_meeting_id_user_id_pk" PRIMARY KEY("meeting_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "target_action" (
	"id" text PRIMARY KEY NOT NULL,
	"type_id" text NOT NULL,
	"responsible_user_id" text,
	"department_id" text,
	"planned_at" date NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'planned' NOT NULL,
	"result" text,
	"source_type" text NOT NULL,
	"source_id" text,
	"account_id" text,
	"lead_id" text,
	"tender_id" text,
	"signal_id" text,
	"initiative_id" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_action_type" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "target_action_type_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "meeting" DROP CONSTRAINT "meeting_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "company_account" ADD COLUMN "wishlist_offer" text;--> statement-breakpoint
ALTER TABLE "company_account" ADD COLUMN "contact_notes" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "scheduled_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "status" text DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "meeting_type" text DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "organizer_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "department_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "lead_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "tender_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting_external_participant" ADD CONSTRAINT "meeting_external_participant_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_external_participant" ADD CONSTRAINT "meeting_external_participant_contact_id_company_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."company_contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_type_id_target_action_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."target_action_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_responsible_user_id_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_account_id_company_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."company_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_tender_id_tender_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tender"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_action" ADD CONSTRAINT "target_action_signal_id_signal_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_external_participant_meeting_id_idx" ON "meeting_external_participant" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_participant_meeting_id_idx" ON "meeting_participant" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_participant_user_id_idx" ON "meeting_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "target_action_type_id_idx" ON "target_action" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "target_action_responsible_user_id_idx" ON "target_action" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE INDEX "target_action_department_id_idx" ON "target_action" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "target_action_status_idx" ON "target_action" USING btree ("status");--> statement-breakpoint
CREATE INDEX "target_action_planned_at_idx" ON "target_action" USING btree ("planned_at");--> statement-breakpoint
CREATE INDEX "target_action_deleted_at_idx" ON "target_action" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "target_action_source_idx" ON "target_action" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "target_action_type_deleted_at_idx" ON "target_action_type" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_account_id_company_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."company_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_tender_id_tender_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tender"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_organizer_id_idx" ON "meeting" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "meeting_department_id_idx" ON "meeting" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "meeting_status_idx" ON "meeting" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meeting_scheduled_at_idx" ON "meeting" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "meeting_deleted_at_idx" ON "meeting" USING btree ("deleted_at");