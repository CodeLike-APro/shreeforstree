import {
  badRequest,
  internalServerError,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSessionId, upsertCartItem } from "@/lib/cart-utils";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema/cart.schema";
import { and, eq, isNull } from "drizzle-orm/sql/expressions/conditions";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Please login to merge carts");
    }

    const sessionId = getSessionId(request);

    if (!sessionId) {
      return badRequest("Session ID is required");
    }

    const mergedCartItems = await db.transaction(async (tx) => {
      const guestCart = await tx.query.carts.findFirst({
        where: (carts, { and, eq, isNull }) =>
          and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
      });

      if (!guestCart) {
        return badRequest("No guest cart found to merge");
      }

      // insert-first with onConflictDoNothing against carts_user_id_unique
      // closes the same find-then-insert race as getOrCreateCart
      await tx
        .insert(carts)
        .values({ sessionId, userId: currentUser.id })
        .onConflictDoNothing({ target: carts.userId });

      const userCart = await tx.query.carts.findFirst({
        where: (carts, { eq }) => eq(carts.userId, currentUser.id),
      });

      if (!userCart) {
        throw new Error("Failed to get or create user cart during merge");
      }

      const guestCartItems = await tx.query.cartItems.findMany({
        where: (cartItems, { eq }) => eq(cartItems.cartId, guestCart.id),
      });

      for (const guestItem of guestCartItems) {
        // atomic upsert against the cart_items unique constraint — same
        // helper used by the add-to-cart route
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

      return userCart;
    });

    // badRequest() returned from inside the transaction callback is a
    // Response, not cart data — pass it through instead of wrapping in ok()
    if (mergedCartItems instanceof Response) {
      return mergedCartItems;
    }

    return ok("Carts merged successfully", mergedCartItems);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to merge carts", error);
  }
}
