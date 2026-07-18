import {
  badRequest,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getOrCreateCart, getSessionId } from "@/lib/cart-utils";
import {
  FREE_SHIPPING_THRESHOLD,
  MAX_CART_ITEMS,
  SHIPPING_CHARGE,
} from "@/lib/constants";
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
      return ok("No items in cart", {
        cartId: cart.id,
        items: [],
        originalPriceTotal: "0.00",
        discountedPriceTotal: "0.00",
        discountAmount: "0.00",
        shippingCharge: "0.00",
        amountToFreeShipping: String(FREE_SHIPPING_THRESHOLD),
        total: "0.00",
      });
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
              orderBy: (media, { asc }) => asc(media.sortOrder),
              limit: 1,
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

    const originalPriceTotal = activeCartItems.reduce((sum, item) => {
      const originalAmount = Number(item.product.price) * item.quantity;
      return sum + originalAmount;
    }, 0.0);

    const discountedPriceTotal = activeCartItems.reduce((sum, item) => {
      const discountedAmount =
        Number(item.product.discountedPrice ?? item.product.price) *
        item.quantity;
      return sum + discountedAmount;
    }, 0.0);

    const discountAmount = originalPriceTotal - discountedPriceTotal;

    const amountToFreeShipping =
      discountedPriceTotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : FREE_SHIPPING_THRESHOLD - discountedPriceTotal;

    const shippingCharge =
      discountedPriceTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

    const total = discountedPriceTotal + shippingCharge;

    return ok("Cart fetched successfully", {
      cartId: cart.id,
      items: activeCartItems,
      originalPriceTotal: String(originalPriceTotal.toFixed(2)),
      discountedPriceTotal: String(discountedPriceTotal.toFixed(2)),
      shippingCharge: String(shippingCharge.toFixed(2)),
      discountAmount: String(discountAmount.toFixed(2)),
      amountToFreeShipping: String(amountToFreeShipping.toFixed(2)),
      total: String(total.toFixed(2)),
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

    if (!foundProduct.sizes.includes(size)) {
      return badRequest(`Size ${size} is not available for this product`);
    }

    if (!foundProduct.colors.includes(color)) {
      return badRequest(`Color ${color} is not available for this product`);
    }

    const updatedCart = await db.transaction(async (tx) => {
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

        if (newQuantity > MAX_CART_ITEMS) {
          // throwing Response objects is caught below and returned directly
          throw badRequest(
            `Maximum quantity for a single item is ${MAX_CART_ITEMS}`,
          );
        }

        const [updatedItem] = await tx
          .update(cartItems)
          .set({ quantity: newQuantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        return updatedItem;
      }

      const [newItem] = await tx
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          quantity,
          color,
          size,
        })
        .returning();

      return newItem;
    });

    return ok("Item added to cart successfully", updatedCart);
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
