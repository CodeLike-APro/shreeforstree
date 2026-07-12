import {
  badRequest,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getOrCreateCart, getSessionId } from "@/lib/cart-utils";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema/cartItem.schema";
import { addCartItemSchema } from "@/lib/validators/cart.validators";
import { eq } from "drizzle-orm/sql/expressions/conditions";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return badRequest("Session ID is required");
    }

    const cart = await getOrCreateCart(currentUser?.id ?? null, sessionId);

    if (!cart.cartItems || cart.cartItems.length === 0) {
      return ok("No items in cart", { items: [], total: 0.0 });
    }

    const cartItems = await db.query.cartItems.findMany({
      where: (cartItems, { eq }) => eq(cartItems.cartId, cart.id),
      with: {
        product: {
          columns: {
            id: true,
            title: true,
            price: true,
            discountedPrice: true,
            isActive: true,
          },
          with: {
            productMedia: {
              columns: {
                url: true,
              },
            },
          },
        },
      },
    });

    const itemsWithProductDetails = cartItems.map((item) => ({
      ...item,
      product: {
        title: item.product.title,
        price: item.product.price,
        discountedPrice: item.product.discountedPrice,
        imageUrl: item.product.productMedia[0]?.url ?? null,
        isActive: item.product.isActive,
      },
    }));

    const activeCartItems = itemsWithProductDetails.filter(
      (item) => item.product.isActive,
    );

    const total = activeCartItems.reduce((sum, item) => {
      const price = item.product.discountedPrice ?? item.product.price;
      return sum + Number(price) * item.quantity;
    }, 0.0);

    return ok("Cart fetched successfully", {
      cartId: cart.id,
      items: activeCartItems,
      total: String(total),
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to get cart", error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return badRequest("Session ID is required");
    }

    const item = await request.json();

    const result = await addCartItemSchema.safeParseAsync(item);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { productId, quantity, color, size } = result.data;

    const foundProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (!foundProduct || !foundProduct.isActive) {
      return notFound("Product not found");
    }

    if (color && !foundProduct.colors.includes(color)) {
      return badRequest(`Color ${color} is not available for this product`);
    }

    await db.transaction(async (tx) => {
      const cart = await getOrCreateCart(
        currentUser?.id ?? null,
        sessionId,
        tx,
      );

      const existingItem = await tx.query.cartItems.findFirst({
        where: (cartItems, { and, eq }) =>
          and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.productId, productId),
            eq(cartItems.color, color),
            eq(cartItems.size, size),
          ),
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > 10) {
          throw new Error(
            `Cannot add more than 10 items of the same product, color, and size`,
          );
        }

        await tx
          .update(cartItems)
          .set({ quantity: newQuantity })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        await tx.insert(cartItems).values({
          cartId: cart.id,
          productId,
          quantity,
          color,
          size,
        });
      }
    });

    return ok("Item added to cart successfully");
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to add item to cart", error);
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return badRequest("Session ID is required");
    }

    const cart = await getOrCreateCart(currentUser?.id ?? null, sessionId);

    const ownsCart =
      (currentUser && cart.userId === currentUser.id) ||
      cart.sessionId === sessionId;

    if (!ownsCart) {
      return unauthorized("You can only modify your own cart");
    }

    const clearedCart = await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cart.id))
      .returning();

    return ok("Cart cleared successfully", { clearedCart });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return internalServerError("Failed to clear cart", error);
  }
}
