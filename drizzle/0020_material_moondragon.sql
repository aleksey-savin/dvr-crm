ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-09 04:48:55.473';--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;