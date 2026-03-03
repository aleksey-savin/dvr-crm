ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-10 07:57:06.397';--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "wishlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "client_departmentId_position_idx" ON "client" USING btree ("department_id","position");