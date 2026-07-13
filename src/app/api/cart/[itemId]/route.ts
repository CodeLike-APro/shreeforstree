import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSessionId, Tx } from "@/lib/cart-utils";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { updateCartItemSchema } from "@/lib/validators/cart.validators";
import { eq } from "drizzle-orm";

const assertOwnsCartItem = async (
  itemId: string,
  currentUser: { id: string } | null,
  sessionId: string,
  tx?: Tx,
) => {
  try {
    const executor = tx ?? db;

    const item = await executor.query.cartItems.findFirst({
      where: (cartItems, { eq }) => eq(cartItems.id, itemId),
      with: { cart: true },
    });

    if (!item) {
      throw notFound("Cart item not found");
    }
    const ownsCart =
      item.cart.userId === currentUser?.id || item.cart.sessionId === sessionId;

    if (!ownsCart) {
      throw forbidden("You can only modify your own cart");
    }

    return item;
  } catch (error) {
    return internalServerError("Failed to assert cart item ownership", error);
  }
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return badRequest("Session ID is required");
    }

    const { itemId } = await params;

    if (!itemId) {
      return badRequest("Item ID is required");
    }

    const body = await request.json();
    const result = updateCartItemSchema.safeParse(body);

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { quantity } = result.data;

    const updatedItem = await db.transaction(async (tx) => {
      await assertOwnsCartItem(itemId, currentUser, sessionId, tx);

      const [updatedItem] = await tx
        .update(cartItems)
        .set({
          quantity,
        })
        .where(eq(cartItems.id, itemId))
        .returning();

      return updatedItem;
    });
    return ok("Cart item updated successfully", updatedItem);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to update cart item", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return badRequest("Session ID is required");
    }
    const { itemId } = await params;

    if (!itemId) {
      return badRequest("Item ID is required");
    }

    await assertOwnsCartItem(itemId, currentUser, sessionId);

    const [deletedItem] = await db
      .delete(cartItems)
      .where(eq(cartItems.id, itemId))
      .returning();

    return ok("Cart item deleted successfully", deletedItem);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to delete cart item", error);
  }
}
