import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productCategories } from "./productCategory.schema";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }),
  imagesUrl: text("images_url").array().notNull(),
  sizes: text("sizes").array().notNull(),
  colors: text("colors").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isNewArrival: boolean("is_new_arrival").notNull().default(false),
  isHeroProduct: boolean("is_hero_product").notNull().default(false),
  heroImageUrl: text("hero_image_url"),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const productRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
}));
