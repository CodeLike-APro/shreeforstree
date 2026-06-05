import {
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { addresses } from "./address.schema";
import { orderItems } from "./orderItem.schema";
import { payments, paymentStatusEnum } from "./payment.schema";

export const orderStatusEnum = pgEnum("order_status", [
  "not_placed",
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  orderStatus: orderStatusEnum("order_status").notNull().default("not_placed"),
  trackingNumber: text("tracking_number").unique(),
  addressId: uuid("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "restrict" }),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
  orderItems: many(orderItems),
}));
