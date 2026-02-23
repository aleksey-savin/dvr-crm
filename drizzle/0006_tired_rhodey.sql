ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-02 09:29:13.810';--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "archivedAt" timestamp with time zone;