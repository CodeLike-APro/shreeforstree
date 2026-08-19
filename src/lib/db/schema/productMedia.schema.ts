import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products.schema";
import { relations } from "drizzle-orm";

export const productMedia = pgTable("product_media", {
  id: uuid("id").primaryKey().defaultRandom(),

  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  type: text("type", { enum: ["image", "video"] }).notNull(),

  url: text("url").notNull(),
  path: text("path").notNull(),

  sortOrder: integer("sort_order").notNull().default(0),
  isHero: boolean("is_hero").notNull().default(false),
  isFabricSwatch: boolean("is_fabric_swatch").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
}));
