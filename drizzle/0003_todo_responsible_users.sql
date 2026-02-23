CREATE TABLE "todo_responsible_users" (
	"todo_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "todo_responsible_users_todo_id_user_id_pk" PRIMARY KEY("todo_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todo_responsible_users" ADD CONSTRAINT "todo_responsible_users_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_responsible_users" ADD CONSTRAINT "todo_responsible_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todo_responsible_users_todoId_idx" ON "todo_responsible_users" USING btree ("todo_id");--> statement-breakpoint
CREATE INDEX "todo_responsible_users_userId_idx" ON "todo_responsible_users" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;