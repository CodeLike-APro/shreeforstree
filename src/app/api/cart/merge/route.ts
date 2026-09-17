import { internalServerError, unauthorized } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  getOrCreateCart,
  getOrCreateSessionId,
  upsertCartItem,
} from "@/lib/cart-utils";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema/cart.schema";
import { handleResponse } from "@/lib/response-handler";
import { and, eq, isNull } from "drizzle-orm/sql/expressions/conditions";
import type { ServiceResponse } from "@/lib/response-handler";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Please login to merge carts");
    }

    const sessionId = await getOrCreateSessionId();

    const mergedCartItems = await db.transaction(
      async (
        tx,
      ): Promise<ServiceResponse<{ merged: boolean; userCartId?: string }>> => {
        const guestCart = await tx.query.carts.findFirst({
          where: (carts, { and, eq, isNull }) =>
            and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
        });

        if (!guestCart) {
          return {
            kind: "ok",
            message: "No guest cart found to merge",
            data: { merged: false },
          };
        }
        const userCart = await getOrCreateCart(currentUser.id, sessionId, tx);

        if (userCart instanceof Response) throw userCart;

        const guestCartItems = await tx.query.cartItems.findMany({
          where: (cartItems, { eq }) => eq(cartItems.cartId, guestCart.id),
        });

        for (const guestItem of guestCartItems) {
          await upsertCartItem(tx, {
            cartId: userCart.id,
            productId: guestItem.productId,
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
          );

        return {
          kind: "ok",
          message: "Carts merged successfully",
          data: { merged: true, userCartId: userCart.id },
        };
      },
    );

    const mergedCartItemsResponse = handleResponse(mergedCartItems);

    return mergedCartItemsResponse;
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to merge carts", error);
  }
}
