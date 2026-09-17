import type {
  addresses,
  cartItems,
  carts,
  categories,
  orderItems,
  orders,
  orderStatusEnum,
  payments,
  paymentStatusEnum,
  productCategories,
  productMedia,
  products,
  reviews,
  user,
  wishlist,
} from "@/lib/db/schema";

export type Address = typeof addresses.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type ProductMedia = typeof productMedia.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type User = typeof user.$inferSelect;
export type WishlistItem = typeof wishlist.$inferSelect;

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
