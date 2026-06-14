ALTER TABLE "proposal" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN "proposal_type";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN "valid_until";--> statement-breakpoint
ALTER TABLE "proposal" DROP COLUMN "is_current";