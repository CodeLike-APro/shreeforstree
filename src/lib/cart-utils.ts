import { sql } from "drizzle-orm";
import { internalServerError } from "./api-response";
import { db } from "./db";
import { carts, cartItems } from "./db/schema";
import { cookies } from "next/headers";
import { setCartCookie } from "@/app/actions";

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
  try {
    const executor = tx ?? db;

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
