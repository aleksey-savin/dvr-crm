ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-03 03:00:16.257';--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "department_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;