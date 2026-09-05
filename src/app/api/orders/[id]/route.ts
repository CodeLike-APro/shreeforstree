import {
  badRequest,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { assertOrderOwnership, getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { resolveGuestToken } from "@/lib/order-utils";
import { handleResponse } from "@/lib/response-handler";
import z4 from "zod/v4";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);

    const { id: orderId } = await params;

    const result = z4.uuid({ message: "Invalid order ID" }).safeParse(orderId);

    if (!result.success) {
      return badRequest("Invalid order ID");
    }

    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      with: {
        orderItems: true,
        payments: true,
      },
    });

    if (!order) {
      return notFound("Order not found");
    }

    const token = await resolveGuestToken(
      orderId,
      request.headers.get("guest-token"),
    );

    const ownershipCheck = await assertOrderOwnership(
      order,
      currentUser?.id,
      token,
    );

    const ownershipResponse = handleResponse(ownershipCheck);

    if (ownershipResponse.status !== 200) {
      return ownershipResponse;
    }

    return ok("Order fetched successfully", order);
  } catch (error) {
    return internalServerError("Failed to fetch order", error);
  }
}
