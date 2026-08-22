import { Payments } from "razorpay/dist/types/payments";
import { Tx } from "./cart-utils";
import { db } from "./db";
import { auth } from "./db/auth";
import { cartItems, orders } from "./db/schema";
import crypto from "crypto";

export async function getCurrentUser(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user ?? null;
  } catch (error) {
    console.error(`Error fetching current user: ${error}`);
    return null;
  }
}

export async function adminCheck(request: Request): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const isAdmin = session?.user?.role === "admin";
    return isAdmin;
  } catch (error) {
    console.error(`Error checking admin status: ${error}`);
    return false;
  }
}

type OrderOwnershipCheck = {
  kind: "ok" | "forbidden" | "badRequest";
  message: string;
};

export async function assertOrderOwnership(
  order: typeof orders.$inferSelect,
  currentUserId?: string | null,
  guestToken?: string,
): Promise<OrderOwnershipCheck> {
  if (currentUserId) {
    if (order.userId === currentUserId) {
      return {
        kind: "ok",
        message: "Ownership verified via user account",
      };
    }

    if (!guestToken) {
      return {
        kind: "forbidden",
        message: "You are not the owner of this order",
      };
    }
  }

  if (guestToken && order.guestToken) {
    const bufA = Buffer.from(order.guestToken, "utf-8");
    const bufB = Buffer.from(guestToken, "utf-8");

    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return {
        kind: "ok",
        message: "Ownership verified via guest token",
      };
    }
  }

  return {
    kind: "forbidden",
    message: "You are not the owner of this order",
  };
}

type CartItemOwnershipCheck = {
  kind: "ok" | "notFound" | "forbidden" | "badRequest" | "internalServerError";
  message: string;
  error?: unknown;
  item?: typeof cartItems.$inferSelect;
};

export const assertOwnsCartItem = async (
  itemId: string,
  currentUser: { id: string } | null,
  sessionId: string,
  tx?: Tx,
): Promise<CartItemOwnershipCheck> => {
  try {
    const executor = tx ?? db;

    const item = await executor.query.cartItems.findFirst({
      where: (cartItems, { eq }) => eq(cartItems.id, itemId),
      with: { cart: true },
    });

    if (!item) {
      return { kind: "notFound", message: "Cart item not found" };
    }
    const ownsCart =
      item.cart.userId === currentUser?.id || item.cart.sessionId === sessionId;

    if (!ownsCart) {
      return {
        kind: "forbidden",
        message: "You can only modify your own cart",
      };
    }

    return { kind: "ok", message: "Ownership verified", item };
  } catch (error) {
    return {
      kind: "internalServerError",
      message: "Failed to assert cart item ownership",
      error: error,
    };
  }
};

type ValidationResult =
  { kind: "ok"; message: string } | { kind: "badRequest"; message: string };

export const assertPaymentValid = (
  paymentdetails: Payments.RazorpayPayment,
  order: typeof orders.$inferSelect,
  razorpayOrderId: string,
): ValidationResult => {
  if (paymentdetails.order_id !== razorpayOrderId) {
    return {
      kind: "badRequest",
      message: "Payment does not belong to this order",
    };
  }

  if (paymentdetails.status !== "captured") {
    return { kind: "badRequest", message: "Payment not captured" };
  }

  if (
    Number(paymentdetails.amount) !==
      Math.round(Number(order.totalAmount) * 100) ||
    paymentdetails.currency !== "INR"
  ) {
    return { kind: "badRequest", message: "Payment amount mismatch" };
  }

  return { kind: "ok", message: "Payment is valid" };
};
