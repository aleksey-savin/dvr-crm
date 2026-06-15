ALTER TABLE "meeting" ADD COLUMN IF NOT EXISTS "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN IF NOT EXISTS "reschedule_count" integer DEFAULT 0 NOT NULL;
