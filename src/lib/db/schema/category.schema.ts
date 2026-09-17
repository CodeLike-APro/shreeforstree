import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { productCategories } from "./productCategory.schema";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryImageUrl: text("category_image_url"),
  categoryImagePath: text("category_image_path"),
  sizeChartImageUrl: text("size_chart_image_url"),
  sizeChartImagePath: text("size_chart_image_path"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(productCategories),
}));
