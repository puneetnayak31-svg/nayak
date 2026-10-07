CREATE TABLE "expert_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"brand_id" uuid,
	"service" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"budget" text,
	"timeline" text,
	"details" text,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_assets" ADD COLUMN "data" text;--> statement-breakpoint
ALTER TABLE "brand_assets" ADD COLUMN "content_type" text;--> statement-breakpoint
ALTER TABLE "expert_requests" ADD CONSTRAINT "expert_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_requests" ADD CONSTRAINT "expert_requests_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expert_requests_status_idx" ON "expert_requests" USING btree ("status","created_at");