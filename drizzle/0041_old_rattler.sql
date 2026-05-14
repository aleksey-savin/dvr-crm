CREATE TABLE "client_classification_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"target_gross_profit_threshold" numeric DEFAULT '0' NOT NULL,
	"lost_activity_years" integer DEFAULT 1 NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_classification_settings" ADD CONSTRAINT "client_classification_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;