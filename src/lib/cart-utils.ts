import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { setCartCookie } from "@/app/actions";
import { internalServerError } from "./api-response";
import { db } from "./db";
import { cartItems, carts } from "./db/schema";

export async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  let cartCookie = cookieStore.get("cartCookie")?.value ?? null;
  if (!cartCookie) {
    cartCookie = await setCartCookie();
  }
  return cartCookie;
}

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getOrCreateCart(
  userId: string | null,
  sessionId: string,
  tx?: Tx,
) {
  const conflictTarget = userId
    ? { target: carts.userId, where: sql`${carts.userId} is not null` }
    : { target: carts.sessionId, where: sql`${carts.userId} is null` };

  try {
    const executor = tx ?? db;

    await executor
      .insert(carts)
      .values({ userId, sessionId })
      .onConflictDoNothing(conflictTarget);

    const fullCart = await executor.query.carts.findFirst({
      where: (carts, { and, eq, isNull }) =>
        userId
          ? eq(carts.userId, userId)
          : and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
      with: { cartItems: true },
    });

    if (!fullCart) {
      return internalServerError("Failed to get or create cart");
    }

    return fullCart;
  } catch (error) {
    throw internalServerError("Failed to get or create cart", error);
  }
}

export async function upsertCartItem(
  tx: Tx,
  params: {
    cartId: string;
    productId: string;
    size: string;
    quantity: number;
    maxQuantity: number;
  },
) {
  const { cartId, productId, size, quantity, maxQuantity } = params;

  const [item] = await tx
    .insert(cartItems)
    .values({ cartId, productId, size, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId, cartItems.size],
      set: {
        quantity: sql`LEAST(${cartItems.quantity} + ${quantity}, ${maxQuantity})`,
      },
    })
    .returning();

  return item;
}
