ALTER TABLE "initiative" ADD COLUMN "source_tender_id" text;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_source_tender_id_tender_id_fk" FOREIGN KEY ("source_tender_id") REFERENCES "public"."tender"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "initiative_source_tender_id_idx" ON "initiative" USING btree ("source_tender_id");