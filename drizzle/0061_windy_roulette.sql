ALTER TABLE "proposal" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN IF EXISTS "proposal_type";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN IF EXISTS "amount";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN IF EXISTS "valid_until";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN IF EXISTS "is_current";
