ALTER TABLE "categories" RENAME COLUMN "name" TO "title";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_title_unique" UNIQUE("title");