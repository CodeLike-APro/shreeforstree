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
import { user } from "./auth.schema";
import { addresses } from "./address.schema";
import { orderItems } from "./orderItem.schema";
import { payments, paymentStatusEnum } from "./payment.schema";
import { carts } from "./cart.schema";

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
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: "set null" }),
  originalAmount: numeric("original_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  discountAmount: numeric("discount_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  itemsTotal: numeric("items_total", { precision: 10, scale: 2 }).notNull(),
  shippingCharges: numeric("shipping_charges", {
    precision: 10,
    scale: 2,
  }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  orderStatus: orderStatusEnum("order_status").notNull().default("not_placed"),
  refundRequired: boolean("refund_required").notNull().default(false),
  trackingNumber: text("tracking_number").unique(),
  addressId: uuid("address_id").references(() => addresses.id, {
    onDelete: "set null",
  }),
  guestToken: text("guest_token").unique(),
  shippingFullName: text("shipping_full_name").notNull(),
  shippingPhone: text("shipping_phone").notNull(),
  shippingEmail: text("shipping_email").notNull(),
  shippingAddressLine1: text("shipping_address_line1").notNull(),
  shippingAddressLine2: text("shipping_address_line2"),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state").notNull(),
  shippingPincode: text("shipping_pincode").notNull(),
  shippingCountry: text("shipping_country").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  cart: one(carts, {
    fields: [orders.cartId],
    references: [carts.id],
  }),
  payments: many(payments),
  orderItems: many(orderItems),
}));
