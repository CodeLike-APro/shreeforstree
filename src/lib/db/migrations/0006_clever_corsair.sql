ALTER TABLE "payments" ALTER COLUMN "transaction_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "method" DROP NOT NULL;