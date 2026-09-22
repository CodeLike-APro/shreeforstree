import { and, eq } from "drizzle-orm";
import { badRequest, forbidden, internalServerError } from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";
import { handleResponse, type ServiceResponse } from "@/lib/response-handler";
import { refundSchema } from "@/lib/validators/payment.validator";

import type { Order } from "@/types/models";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("You are not allowed to change payment statuses.");
    }

    const body = await request.json();

    const result = await refundSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest("Invalid orderId");
    }

    const { orderId } = result.data;

    const updated: ServiceResponse<Order> = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order) {
        return { kind: "notFound", message: "Order not found" };
      }

      if (
        !order.refundRequired ||
        !["cancelled", "returned"].includes(order.orderStatus)
      ) {
        return { kind: "conflict", message: "Refund not allowed" };
      }

      await tx
        .update(payments)
        .set({ status: "refunded" })
        .where(
          and(eq(payments.orderId, orderId), eq(payments.status, "success")),
        );

      const [row] = await tx
        .update(orders)
        .set({ paymentStatus: "refunded", refundRequired: false })
        .where(eq(orders.id, orderId))
        .returning();

      return {
        kind: "ok",
        message: "Refund processed successfully",
        data: row,
      };
    });

    return handleResponse(updated);
  } catch (error) {
    return internalServerError("An unexpected error occurred", error);
  }
}
