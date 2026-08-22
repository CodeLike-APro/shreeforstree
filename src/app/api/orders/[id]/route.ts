import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Unauthorized access");
    }

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

    if (order.userId !== currentUser.id && currentUser.role !== "admin") {
      return forbidden("You do not have permission to access this order");
    }

    return ok("Order fetched successfully", order);
  } catch (error) {
    return internalServerError("Failed to fetch order", error);
  }
}
