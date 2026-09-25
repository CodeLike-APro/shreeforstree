import "server-only";
import { cookies, headers } from "next/headers";
import * as z4 from "zod/v4";
import { assertOrderOwnership, getCurrentUser } from "./auth-utils";
import { db } from "./db";

export async function setGuestOrderCookie({
  orderId,
  guestToken,
}: {
  orderId: string;
  guestToken: string;
}): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: `guest_order_${orderId}`,
    value: guestToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function resolveGuestToken(
  orderId: string,
  tokenFromRequest?: string | null,
): Promise<string | undefined> {
  if (tokenFromRequest) {
    if (tokenFromRequest.trim() !== "") return tokenFromRequest.trim();
  }

  const cookieStore = await cookies();

  const guestTokenCookie = cookieStore.get(`guest_order_${orderId}`);
  if (guestTokenCookie?.value) {
    return guestTokenCookie.value;
  }

  return undefined;
}

export async function getOwnedOrder({ orderId }: { orderId: string }) {
  const result = z4.uuid().safeParse(orderId);

  if (!result.success) {
    return { kind: "error", status: 400, message: "Invalid order ID" };
  }

  const orderDetails = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.id, orderId),
    with: {
      orderItems: {
        orderBy: (orderItems, { desc }) => [
          desc(orderItems.createdAt),
          desc(orderItems.id),
        ],
      },
      payments: {
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      },
    },
  });

  if (!orderDetails) {
    return { kind: "error", status: 404, message: "Order not found" };
  }

  const currentUser = await getCurrentUser(await headers());

  const token = await resolveGuestToken(orderId);

  const isOrderOwner = await assertOrderOwnership(
    orderDetails,
    currentUser?.id,
    token,
  );

  if (isOrderOwner.kind !== "ok") {
    return { kind: "error", status: 400, message: "Invalid order ID" };
  }

  return {
    kind: "ok",
    message: "Order details fetched successfully",
    data: orderDetails,
  };
}
