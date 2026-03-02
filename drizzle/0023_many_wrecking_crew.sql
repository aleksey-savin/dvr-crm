ALTER TABLE "user" DROP CONSTRAINT "user_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-09 08:01:43.892';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "department_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;