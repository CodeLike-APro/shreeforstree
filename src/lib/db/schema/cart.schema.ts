import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { relations, sql } from "drizzle-orm";
import { cartItems } from "./cartItem.schema";

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    sessionId: text("session_id").notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // one cart per logged-in user
    uniqueIndex("carts_user_id_unique")
      .on(t.userId)
      .where(sql`${t.userId} is not null`),
    // one cart per guest session
    uniqueIndex("carts_session_id_unique")
      .on(t.sessionId)
      .where(sql`${t.userId} is null`),
  ],
);

export const cartRelations = relations(carts, ({ one, many }) => ({
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
  cartItems: many(cartItems),
}));
