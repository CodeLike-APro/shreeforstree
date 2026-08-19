import { sql } from "drizzle-orm";
import { internalServerError } from "./api-response";
import { db } from "./db";
import { carts, cartItems } from "./db/schema";

export function getSessionId(request: Request): string | null {
  return request.headers.get("x-session-id");
}

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getOrCreateCart(
  userId: string | null,
  sessionId: string,
  tx?: Tx,
) {
  try {
    const executor = tx ?? db;

    // Insert-first with onConflictDoNothing against the partial unique
    // indexes (carts_user_id_unique / carts_session_id_unique) closes the
    // find-then-insert race: two concurrent requests for the same
    // user/session can no longer both pass a missing-cart check and each
    // insert their own cart row.
    await executor
      .insert(carts)
      .values({ userId, sessionId })
      .onConflictDoNothing({
        target: userId ? carts.userId : carts.sessionId,
      });

    const fullCart = await executor.query.carts.findFirst({
      where: (carts, { eq }) =>
        userId ? eq(carts.userId, userId) : eq(carts.sessionId, sessionId),
      with: { cartItems: true },
    });

    if (!fullCart) {
      throw new Error("Failed to get or create cart");
    }

    return fullCart;
  } catch (error) {
    throw internalServerError("Failed to get or create cart", error);
  }
}

/**
 * Atomically adds `quantity` to a cart line item (or creates it), capping
 * the resulting quantity at `maxQuantity`, via onConflictDoUpdate against
 * the cart_items unique constraint (cartId, productId, color, size). This
 * closes the find-then-insert/update race on the add-to-cart path —
 * concurrent adds of the same line item merge into one row and the cap is
 * enforced by the database in the same statement, not by an app-level
 * read-then-check that a second request could race past.
 *
 * The cap is applied silently (LEAST) rather than rejecting the whole
 * request, since the database can't atomically decide "reject" vs "apply"
 * without a second round trip that reopens the race.
 */
export async function upsertCartItem(
  tx: Tx,
  params: {
    cartId: string;
    productId: string;
    color: string;
    size: string;
    quantity: number;
    maxQuantity: number;
  },
) {
  const { cartId, productId, color, size, quantity, maxQuantity } = params;

  const [item] = await tx
    .insert(cartItems)
    .values({ cartId, productId, color, size, quantity })
    .onConflictDoUpdate({
      target: [
        cartItems.cartId,
        cartItems.productId,
        cartItems.color,
        cartItems.size,
      ],
      set: {
        quantity: sql`LEAST(${cartItems.quantity} + ${quantity}, ${maxQuantity})`,
      },
    })
    .returning();

  return item;
}
