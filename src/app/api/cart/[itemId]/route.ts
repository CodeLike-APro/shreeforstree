import { eq } from "drizzle-orm";
import { badRequest, internalServerError, ok } from "@/lib/api-response";
import { assertOwnsCartItem, getCurrentUser } from "@/lib/auth-utils";
import { getOrCreateSessionId } from "@/lib/cart-utils";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { handleResponse } from "@/lib/response-handler";
import { updateCartItemSchema } from "@/lib/validators/cart.validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = await getOrCreateSessionId();

    const { itemId } = await params;

    if (!itemId) {
      return badRequest("Item ID is required");
    }

    const body = await request.json();
    const result = await updateCartItemSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { quantity } = result.data;

    const updatedItem = await db.transaction(async (tx) => {
      const ownership = await assertOwnsCartItem(
        itemId,
        currentUser,
        sessionId,
        tx,
      );

      if (ownership.kind !== "ok") {
        return ownership;
      }

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
    return internalServerError("Failed to update cart item", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = await getOrCreateSessionId();
    const { itemId } = await params;

    if (!itemId) {
      return badRequest("Item ID is required");
    }

    const ownership = await assertOwnsCartItem(itemId, currentUser, sessionId);

    const ownershipResponse = handleResponse(ownership);

    if (ownershipResponse.status !== 200) {
      return ownershipResponse;
    }

    const [deletedItem] = await db
      .delete(cartItems)
      .where(eq(cartItems.id, itemId))
      .returning();

    return ok("Cart item deleted successfully", deletedItem);
  } catch (error) {
    return internalServerError("Failed to delete cart item", error);
  }
}
