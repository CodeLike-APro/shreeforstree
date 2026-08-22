import {
  badRequest,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { assertOrderOwnership, getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { handleResponse } from "@/lib/response-handler";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);

    const { id: orderId } = await params;

    if (!orderId) {
      return badRequest("Order ID is required");
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

    const ownershipCheck = await assertOrderOwnership(
      order,
      currentUser?.id,
      request.headers.get("guest-token") || undefined,
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
