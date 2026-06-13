ALTER TABLE "meeting" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "reschedule_count" integer DEFAULT 0 NOT NULL;