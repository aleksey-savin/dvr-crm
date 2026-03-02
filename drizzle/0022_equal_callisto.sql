ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-09 07:58:23.280';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "department_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;