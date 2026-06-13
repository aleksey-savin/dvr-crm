CREATE TABLE "entity_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text NOT NULL,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"segment" text NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_plan_department_user_year_segment_unique" UNIQUE("department_id","user_id","year","segment")
);
--> statement-breakpoint
ALTER TABLE "lead_stage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "signal_stage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tender_stage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "lead_stage" CASCADE;--> statement-breakpoint
DROP TABLE "signal_stage" CASCADE;--> statement-breakpoint
DROP TABLE "tender_stage" CASCADE;--> statement-breakpoint
ALTER TABLE "lead" DROP CONSTRAINT "lead_stage_id_lead_stage_id_fk";
--> statement-breakpoint
ALTER TABLE "signal" DROP CONSTRAINT "signal_stage_id_signal_stage_id_fk";
--> statement-breakpoint
ALTER TABLE "tender" DROP CONSTRAINT "tender_stage_id_tender_stage_id_fk";
--> statement-breakpoint
ALTER TABLE "initiative" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "signal" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_plan" ADD CONSTRAINT "sales_plan_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_plan" ADD CONSTRAINT "sales_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entity_stage_type_order_idx" ON "entity_stage" USING btree ("entity_type","order");--> statement-breakpoint
CREATE INDEX "sales_plan_departmentId_year_idx" ON "sales_plan" USING btree ("department_id","year");--> statement-breakpoint
CREATE INDEX "sales_plan_userId_year_idx" ON "sales_plan" USING btree ("user_id","year");--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_stage_id_entity_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."entity_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_stage_id_entity_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."entity_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_stage_id_entity_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."entity_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "initiative_stage_position_idx" ON "initiative" USING btree ("stage_id","position");--> statement-breakpoint
CREATE INDEX "lead_stage_position_idx" ON "lead" USING btree ("stage_id","position");--> statement-breakpoint
CREATE INDEX "signal_stage_position_idx" ON "signal" USING btree ("stage_id","position");--> statement-breakpoint
CREATE INDEX "tender_stage_position_idx" ON "tender" USING btree ("stage_id","position");