CREATE TABLE "changelog_release" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "changelog_release" ADD CONSTRAINT "changelog_release_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changelog_release_status_published_at_idx" ON "changelog_release" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "changelog_release_version_idx" ON "changelog_release" USING btree ("version");--> statement-breakpoint
CREATE INDEX "changelog_release_author_id_idx" ON "changelog_release" USING btree ("author_id");
