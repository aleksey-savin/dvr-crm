ALTER TABLE "target_action_type" ADD COLUMN IF NOT EXISTS "is_plannable" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
UPDATE "target_action_type" SET "is_plannable" = false WHERE "slug" = 'meeting_rescheduled';
