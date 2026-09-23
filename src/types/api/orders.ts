import type { Order, OrderItem, Payment } from "../models";
import type { updateOrderFields } from "@/lib/validators/order.validators";

// GET /api/orders — list row; the query only pulls item ids for a count
export type OrdersListItem = Order & {
  orderItems: (Pick<OrderItem, "id"> &
    Partial<Pick<OrderItem, "productImageUrl">>)[];
};

// GET /api/orders/[id] — full detail
export type OrderDetail = Order & {
  orderItems: OrderItem[];
  payments: Payment[];
};

// GET /api/orders/[id]/status — polled by /checkout/[orderId]/confirming
export type OrderPollStatus = "pending" | "success" | "failed" | "refunded";

export type OrderStatusData = {
  status: OrderPollStatus;
  failureReason: string | null;
};

export type OrderFieldErrors = Partial<
  Record<keyof typeof updateOrderFields.shape, string[]>
>;
