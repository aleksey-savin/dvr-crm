CREATE TABLE "signal_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refusal_reason" ADD COLUMN "entity_types" text[] DEFAULT '{"lead","tender","signal"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "signal" ADD COLUMN "stage_id" text;--> statement-breakpoint
ALTER TABLE "signal" ADD COLUMN "lost_reason_id" text;--> statement-breakpoint
ALTER TABLE "signal" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE INDEX "signal_stage_order_idx" ON "signal_stage" USING btree ("order");--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_stage_id_signal_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."signal_stage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_lost_reason_id_refusal_reason_id_fk" FOREIGN KEY ("lost_reason_id") REFERENCES "public"."refusal_reason"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "signal_lost_reason_id_idx" ON "signal" USING btree ("lost_reason_id");--> statement-breakpoint
CREATE INDEX "signal_stage_id_idx" ON "signal" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "signal_archived_at_idx" ON "signal" USING btree ("archived_at");