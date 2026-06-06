import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { relations } from "drizzle-orm";
import { cartItems } from "./cartItem.schema";

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cartRelations = relations(carts, ({ one, many }) => ({
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
  cartItems: many(cartItems),
}));
