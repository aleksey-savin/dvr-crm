CREATE TABLE "wishlist_client_responsible_users" (
	"wishlist_client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_client_responsible_users_wishlist_client_id_user_id_pk" PRIMARY KEY("wishlist_client_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 14:24:27.638';--> statement-breakpoint
ALTER TABLE "wishlist_client_responsible_users" ADD CONSTRAINT "wishlist_client_responsible_users_wishlist_client_id_wishlist_client_id_fk" FOREIGN KEY ("wishlist_client_id") REFERENCES "public"."wishlist_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_client_responsible_users" ADD CONSTRAINT "wishlist_client_responsible_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wishlist_client_responsible_wishlistClientId_idx" ON "wishlist_client_responsible_users" USING btree ("wishlist_client_id");--> statement-breakpoint
CREATE INDEX "wishlist_client_responsible_userId_idx" ON "wishlist_client_responsible_users" USING btree ("user_id");