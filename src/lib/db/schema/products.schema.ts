import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productCategories } from "./productCategory.schema";
import { productMedia } from "./productMedia.schema";

export const PRODUCT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "Free Size",
] as const;

export const productSizeEnum = pgEnum("product_size", PRODUCT_SIZES);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }),
  sizes: productSizeEnum("sizes").array().notNull(),
  colors: text("colors").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isNewArrival: boolean("is_new_arrival").notNull().default(false),
  isHeroProduct: boolean("is_hero_product").notNull().default(false),
  slug: text("slug").notNull().unique(),
  fabric: text("fabric").notNull(),
  work: text("work").array().default([]),
  silhouette: text("silhouette"),
  lining: text("lining"),
  sleeveType: text("sleeve_type"),
  neckline: text("neckline"),
  length: text("length"),
  careInstructions: text("care_instructions"),
  keywords: text("keywords").array().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const productRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
  productMedia: many(productMedia),
}));
