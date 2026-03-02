CREATE TABLE "meeting" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"transcription" text,
	"company_id" text
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-05 02:40:58.136';--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;