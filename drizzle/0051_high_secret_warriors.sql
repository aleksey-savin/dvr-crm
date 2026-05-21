CREATE TABLE "lead_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "stage_id" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE INDEX "lead_stage_order_idx" ON "lead_stage" USING btree ("order");--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_stage_id_lead_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."lead_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_stage_id_idx" ON "lead" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "lead_archived_at_idx" ON "lead" USING btree ("archived_at");