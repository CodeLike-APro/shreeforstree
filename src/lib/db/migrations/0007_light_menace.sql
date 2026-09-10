ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_id_product_id_color_size_unique";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_product_id_size_unique" UNIQUE("cart_id","product_id","size");