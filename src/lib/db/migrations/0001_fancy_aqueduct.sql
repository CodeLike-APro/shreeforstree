ALTER TABLE "categories" ADD COLUMN "size_chart_image_url" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "size_chart_image_path" text;--> statement-breakpoint
ALTER TABLE "product_media" ADD COLUMN "is_fabric_swatch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "fabric" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "work" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "silhouette" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "lining" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sleeve_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "neckline" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "care_instructions" text;