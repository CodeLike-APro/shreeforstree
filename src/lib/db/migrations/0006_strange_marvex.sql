ALTER TABLE "orders" ADD COLUMN "guest_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_guest_token_unique" UNIQUE("guest_token");