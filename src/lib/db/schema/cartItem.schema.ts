import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { carts } from "./cart.schema";
import { products } from "./products.schema";
import { relations } from "drizzle-orm";

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  color: text("color").notNull(),
  size: text("size").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
