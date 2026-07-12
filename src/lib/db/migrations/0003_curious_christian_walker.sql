ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_address_id_addresses_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "address_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingFullName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingPhone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingAddressLine1" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingAddressLine2" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingCity" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingState" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingPincode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingCountry" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;