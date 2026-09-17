import { and, eq } from "drizzle-orm";
import z4 from "zod/v4";
import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import {
  adminCheck,
  assertOrderOwnership,
  getCurrentUser,
} from "@/lib/auth-utils";
import { VALID_ORDER_TRANSITIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema/order.schema";
import { resolveGuestToken } from "@/lib/order-utils";
import { handleResponse } from "@/lib/response-handler";
import { updateOrderSchema } from "@/lib/validators/order.validators";

import type { OrderStatusData } from "@/types/api/orders";
import type { Order } from "@/types/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    const guestToken = request.headers.get("guest-token");
    const { id: orderId } = await params;

    if (!orderId) {
      return badRequest("Order ID is required");
    }

    const result = await z4.uuid().safeParseAsync(orderId);

    if (!result.success) {
      return badRequest("Invalid Order ID");
    }

    const token = await resolveGuestToken(orderId, guestToken);

    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      with: {
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
        },
      },
    });

    if (!order) {
      return notFound("Order not found");
    }

    const isOwner = await assertOrderOwnership(
      order,
      currentUser?.id ?? null,
      token,
    );

    const handleIsOwner = handleResponse(isOwner);

    if (handleIsOwner.status !== 200) {
      return handleIsOwner;
    }

    const statusAndFailureReason = ((): OrderStatusData => {
      if (
        order.paymentStatus === "success" &&
        order.orderStatus !== "not_placed"
      ) {
        return { status: "success", failureReason: null };
      }

      if (order.paymentStatus === "failed") {
        return {
          status: "failed",
          failureReason: order.payments[0]?.failureReason ?? "Payment failed",
        };
      }

      if (order.paymentStatus === "refunded") {
        return {
          status: "refunded",
          failureReason: null,
        };
      }

      return { status: "pending", failureReason: null };
    })();

    return ok<OrderStatusData>(
      "Order fetched successfully",
      statusAndFailureReason,
      {
        "Cache-Control": "no-store",
      },
    );
  } catch (error) {
    return internalServerError("Failed to fetch order", error);
  }
}

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

    return ok<Order>("Order status updated successfully", updatedOrder);
  } catch (error) {
    return internalServerError("Failed to update order", error);
  }
}
