CREATE TABLE "client_managers" (
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_managers_client_id_user_id_pk" PRIMARY KEY("client_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "client" DROP CONSTRAINT "client_client_manager_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-03 06:36:40.301';--> statement-breakpoint
ALTER TABLE "client_managers" ADD CONSTRAINT "client_managers_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_managers" ADD CONSTRAINT "client_managers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_managers_clientId_idx" ON "client_managers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_managers_userId_idx" ON "client_managers" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "client_manager_id";