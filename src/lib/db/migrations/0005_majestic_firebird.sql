ALTER TABLE "orders" RENAME COLUMN "shippingFullName" TO "shipping_full_name";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingPhone" TO "shipping_phone";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingAddressLine1" TO "shipping_address_line1";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingAddressLine2" TO "shipping_address_line2";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingCity" TO "shipping_city";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingState" TO "shipping_state";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingPincode" TO "shipping_pincode";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shippingCountry" TO "shipping_country";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_required" boolean DEFAULT false NOT NULL;