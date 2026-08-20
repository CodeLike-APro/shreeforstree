ALTER TYPE "public"."payment_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_unique";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id");