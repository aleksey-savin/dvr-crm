CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"completedAt" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
