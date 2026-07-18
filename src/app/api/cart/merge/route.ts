import {
  badRequest,
  internalServerError,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSessionId } from "@/lib/cart-utils";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema/cart.schema";
import { cartItems } from "@/lib/db/schema/cartItem.schema";
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

      let userCart = await tx.query.carts.findFirst({
        where: (carts, { eq }) => eq(carts.userId, currentUser.id),
      });

      if (!userCart) {
        const [newUserCart] = await tx
          .insert(carts)
          .values({
            sessionId,
            userId: currentUser.id,
          })
          .returning();
        userCart = newUserCart;
      }

      const guestCartItems = await tx.query.cartItems.findMany({
        where: (cartItems, { eq }) => eq(cartItems.cartId, guestCart.id),
      });

      for (const guestItem of guestCartItems) {
        const existingItem = await tx.query.cartItems.findFirst({
          where: (cartItems, { and, eq }) =>
            and(
              eq(cartItems.cartId, userCart.id),
              eq(cartItems.productId, guestItem.productId),
              eq(cartItems.color, guestItem.color),
              eq(cartItems.size, guestItem.size),
            ),
        });

        if (existingItem) {
          const newQuantity = Math.min(
            existingItem.quantity + guestItem.quantity,
            MAX_CART_ITEMS,
          );

          await tx
            .update(cartItems)
            .set({ quantity: newQuantity })
            .where(eq(cartItems.id, existingItem.id));
        } else {
          await tx.insert(cartItems).values({
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
            color: guestItem.color,
            size: guestItem.size,
          });
        }
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
    return ok("Carts merged successfully", mergedCartItems);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to merge carts", error);
  }
}
