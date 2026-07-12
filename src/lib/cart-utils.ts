import { internalServerError } from "./api-response";
import { db } from "./db";
import { carts } from "./db/schema";

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

    const cart = await executor.query.carts.findFirst({
      where: (carts, { eq }) =>
        userId ? eq(carts.userId, userId) : eq(carts.sessionId, sessionId),
      with: {
        cartItems: true,
      },
    });

    if (cart) {
      return cart;
    }

    const newCart = await executor
      .insert(carts)
      .values({
        userId,
        sessionId,
      })
      .returning();

    const inserted = newCart[0];

    // fetch the newly created cart including cartItems relation
    const fullCart = await executor.query.carts.findFirst({
      where: (carts, { eq }) => eq(carts.id, inserted.id),
      with: { cartItems: true },
    });

    if (!fullCart) {
      throw new Error("Failed to fetch the newly created cart");
    }

    return fullCart;
  } catch (error) {
    throw internalServerError("Failed to get or create cart", error);
  }
}
