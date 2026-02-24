CREATE TABLE "client_gross_profits" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"year" integer NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_risks" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_target_forecasts" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"year" integer NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_upselling_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "deadline" SET DEFAULT '2026-03-03 06:22:31.548';--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "department_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "target" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "lost" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "lost_reasons" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "client_gross_profits" ADD CONSTRAINT "client_gross_profits_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_risks" ADD CONSTRAINT "client_risks_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_target_forecasts" ADD CONSTRAINT "client_target_forecasts_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_upselling_opportunities" ADD CONSTRAINT "client_upselling_opportunities_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_gross_profits_clientId_idx" ON "client_gross_profits" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_gross_profits_clientId_year_idx" ON "client_gross_profits" USING btree ("client_id","year");--> statement-breakpoint
CREATE INDEX "client_risks_clientId_idx" ON "client_risks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_target_forecasts_clientId_idx" ON "client_target_forecasts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_target_forecasts_clientId_year_idx" ON "client_target_forecasts" USING btree ("client_id","year");--> statement-breakpoint
CREATE INDEX "client_upselling_opportunities_clientId_idx" ON "client_upselling_opportunities" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "gross_profit_last_year";--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "target_forecast_current_year";--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "risks";--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "upselling_opportunities";