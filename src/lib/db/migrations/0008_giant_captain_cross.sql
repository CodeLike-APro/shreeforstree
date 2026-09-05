ALTER TABLE "orders" ADD COLUMN "cart_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_failure_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "color";