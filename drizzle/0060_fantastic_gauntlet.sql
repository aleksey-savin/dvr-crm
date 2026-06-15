CREATE TABLE IF NOT EXISTS "document" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_document" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"document_id" text NOT NULL,
	CONSTRAINT "meeting_document_unique" UNIQUE("meeting_id","document_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proposal_document" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"document_id" text NOT NULL,
	CONSTRAINT "proposal_document_unique" UNIQUE("proposal_id","document_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_document" ADD CONSTRAINT "meeting_document_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_document" ADD CONSTRAINT "meeting_document_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposal_document" ADD CONSTRAINT "proposal_document_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposal_document" ADD CONSTRAINT "proposal_document_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meeting_document_meeting_idx" ON "meeting_document" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proposal_document_proposal_idx" ON "proposal_document" USING btree ("proposal_id");
