ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 14:19:34.474';--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "wishlist_client_id" text;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_wishlist_client_id_wishlist_client_id_fk" FOREIGN KEY ("wishlist_client_id") REFERENCES "public"."wishlist_client"("id") ON DELETE cascade ON UPDATE no action;