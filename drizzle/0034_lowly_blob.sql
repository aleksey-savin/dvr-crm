ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-11 00:56:42.700';--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "wishlist_client" DROP COLUMN "industry";