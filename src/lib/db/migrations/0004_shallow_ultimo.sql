ALTER TABLE "orders" ADD COLUMN "original_amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "items_total" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_charges" numeric(10, 2) NOT NULL;