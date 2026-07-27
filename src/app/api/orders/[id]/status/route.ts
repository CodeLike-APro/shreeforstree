import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { VALID_ORDER_TRANSITIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema/order.schema";
import { updateOrderSchema } from "@/lib/validators/order.validators";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("You do not have permission to update an order");
    }

    const { id: orderId } = await params;

    if (!orderId) {
      return badRequest("Order ID is required");
    }

    const body = await request.json();

    const result = await updateOrderSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    if (!order) {
      return notFound("Order not found");
    }

    const { orderStatus } = result.data;

    const validTransitions = VALID_ORDER_TRANSITIONS[order.orderStatus];

    if (!validTransitions.includes(orderStatus)) {
      return badRequest(
        `Invalid order status transition from ${order.orderStatus} to ${orderStatus}`,
      );
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        orderStatus,
        ...((orderStatus === "cancelled" || orderStatus === "returned") &&
          order.paymentStatus === "success" && { refundRequired: true }),
      })
      // optimistic guard: only apply if the status is still the one the
      // transition was validated against, so concurrent updates can't
      // produce an invalid state
      .where(
        and(eq(orders.id, orderId), eq(orders.orderStatus, order.orderStatus)),
      )
      .returning();

    if (!updatedOrder) {
      return conflict(
        "Order status was changed by another request, please retry",
      );
    }

    return ok("Order status updated successfully", updatedOrder);
  } catch (error) {
    return internalServerError("Failed to update order", error);
  }
}
