import { internalServerError, ok, unauthorized } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getOrCreateSessionId, upsertCartItem } from "@/lib/cart-utils";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema/cart.schema";
import { handleResponse } from "@/lib/response-handler";
import { and, eq, isNull } from "drizzle-orm/sql/expressions/conditions";

type MergedCartItemsResponse =
  | { kind: "ok"; message: string; data: unknown }
  | { kind: "badRequest"; message: string }
  | { kind: "internalServerError"; message: string; error?: unknown };

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Please login to merge carts");
    }

    const sessionId = await getOrCreateSessionId();

    const mergedCartItems: MergedCartItemsResponse = await db.transaction(
      async (tx) => {
        const guestCart = await tx.query.carts.findFirst({
          where: (carts, { and, eq, isNull }) =>
            and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
        });

        if (!guestCart) {
          return {
            kind: "badRequest",
            message: "No guest cart found to merge",
          };
        }
        await tx
          .insert(carts)
          .values({ sessionId, userId: currentUser.id })
          .onConflictDoNothing({ target: carts.userId });

        const userCart = await tx.query.carts.findFirst({
          where: (carts, { eq }) => eq(carts.userId, currentUser.id),
        });

        if (!userCart) {
          return {
            kind: "internalServerError",
            message: "Failed to create or retrieve user cart",
          };
        }

        const guestCartItems = await tx.query.cartItems.findMany({
          where: (cartItems, { eq }) => eq(cartItems.cartId, guestCart.id),
        });

        for (const guestItem of guestCartItems) {
          await upsertCartItem(tx, {
            cartId: userCart.id,
            productId: guestItem.productId,
            color: guestItem.color,
            size: guestItem.size,
            quantity: guestItem.quantity,
            maxQuantity: MAX_CART_ITEMS,
          });
        }
        await tx
          .delete(carts)
          .where(
            and(
              eq(carts.id, guestCart.id),
              eq(carts.sessionId, sessionId),
              isNull(carts.userId),
            ),
          )
          .returning();

        return {
          kind: "ok",
          message: "Carts merged successfully",
          data: { userCartId: userCart.id },
        };
      },
    );

    const mergedCartItemsResponse = handleResponse(mergedCartItems);

    if (mergedCartItemsResponse.status !== 200) {
      return mergedCartItemsResponse;
    }

    return ok("Carts merged successfully", mergedCartItems);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to merge carts", error);
  }
}
