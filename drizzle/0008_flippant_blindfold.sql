ALTER TABLE "todos" ALTER COLUMN "status" SET DEFAULT 'not started';--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-02 09:39:29.295';