CREATE TABLE "meeting_room" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_room_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "location_type" text DEFAULT 'office' NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting" ADD COLUMN "meeting_room_id" text;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_meeting_room_id_meeting_room_id_fk" FOREIGN KEY ("meeting_room_id") REFERENCES "public"."meeting_room"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_meeting_room_id_idx" ON "meeting" USING btree ("meeting_room_id");