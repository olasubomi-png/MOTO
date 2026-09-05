CREATE TYPE "public"."vehicle_availability" AS ENUM('available', 'reserved', 'sold', 'unpublished');--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"mileage" integer DEFAULT 0 NOT NULL,
	"fuel" text NOT NULL,
	"transmission" text NOT NULL,
	"engine" text DEFAULT '' NOT NULL,
	"body_type" text NOT NULL,
	"exterior_color" text DEFAULT '' NOT NULL,
	"interior_color" text DEFAULT '' NOT NULL,
	"condition" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"availability" "vehicle_availability" DEFAULT 'available' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "vehicles_availability_idx" ON "vehicles" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "vehicles_featured_idx" ON "vehicles" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "vehicles_make_idx" ON "vehicles" USING btree ("make");--> statement-breakpoint
CREATE INDEX "vehicles_model_idx" ON "vehicles" USING btree ("model");--> statement-breakpoint
CREATE INDEX "vehicles_year_idx" ON "vehicles" USING btree ("year");--> statement-breakpoint
CREATE INDEX "vehicles_price_idx" ON "vehicles" USING btree ("price");--> statement-breakpoint
CREATE INDEX "vehicles_body_type_idx" ON "vehicles" USING btree ("body_type");
