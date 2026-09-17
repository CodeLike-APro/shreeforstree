import crypto from "crypto";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import {
  badRequest,
  created,
  forbidden,
  internalServerError,
  notFound,
  paginated,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { getOrCreateSessionId } from "@/lib/cart-utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from "@/lib/constants";
import { db } from "@/lib/db";
import { orderItems, orders, orderStatusEnum } from "@/lib/db/schema";
import { setGuestOrderCookie } from "@/lib/order-utils";
import { createOrderSchema } from "@/lib/validators/order.validators";

import type { addresses } from "@/lib/db/schema";
import type { SQL } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Unauthorized access");
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(
      1,
      parseInt(searchParams.get("limit") ?? "10") || 10,
    );
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];
    const orderStatuses = Object.values(orderStatusEnum.enumValues) as string[];
    const orderStatus = searchParams.get("orderStatus");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");

    if (orderStatus) {
      if (!orderStatuses.includes(orderStatus)) {
        return badRequest("Invalid order status");
      }
      conditions.push(
        eq(
          orders.orderStatus,
          orderStatus as (typeof orderStatusEnum.enumValues)[number],
        ),
      );
    }

    const isAdmin = currentUser.role === "admin";

    if (userId && isAdmin) {
      conditions.push(eq(orders.userId, userId));
    }

    if (!isAdmin) {
      conditions.push(eq(orders.userId, currentUser.id));
    }

    if (search && isAdmin) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(orders.shippingFullName, term),
          ilike(orders.shippingEmail, term),
          ilike(sql`upper(right(${orders.id}::text, 8))`, term.toUpperCase()),
        )!,
      );
    }

    const countResult = await db
      .select({ count: count() })
      .from(orders)
      .where(conditions.length ? and(...conditions) : undefined);

    const ordersData = await db.query.orders.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        orderItems: {
          columns: {
            id: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (orders, { desc }) => desc(orders.createdAt),
    });

    return paginated(
      "Orders fetched successfully",
      ordersData,
      countResult[0].count,
      page,
      limit,
    );
  } catch (error) {
    return internalServerError("Failed to fetch orders", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    const sessionId = await getOrCreateSessionId();

    const body = await request.json();
    const result = await createOrderSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const {
      addressId,
      email,
      shippingFullName,
      shippingPhone,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPincode,
      shippingCountry,
    } = result.data;

    let address: typeof addresses.$inferSelect | undefined = undefined;

    if (addressId && currentUser) {
      address = await db.query.addresses.findFirst({
        where: (addresses, { eq }) => eq(addresses.id, addressId),
      });

      if (!address) {
        return notFound("Address not found");
      }

      if (address.userId !== currentUser.id) {
        return forbidden("You are not authorized to use this address");
      }
    }

    const resolvedFullName = address?.fullName ?? shippingFullName;
    const resolvedPhone = address?.phone ?? shippingPhone;
    const resolvedAddressLine1 = address?.addressLine1 ?? shippingAddressLine1;
    const resolvedAddressLine2 = address?.addressLine2 ?? shippingAddressLine2;
    const resolvedCity = address?.city ?? shippingCity;
    const resolvedState = address?.state ?? shippingState;
    const resolvedPincode = address?.pincode ?? shippingPincode;
    const resolvedCountry = address?.country ?? shippingCountry;

    if (
      !resolvedFullName ||
      !resolvedPhone ||
      !resolvedAddressLine1 ||
      !resolvedCity ||
      !resolvedState ||
      !resolvedPincode ||
      !resolvedCountry
    ) {
      return badRequest("Shipping details are required");
    }

    let guestToken: string | undefined = undefined;

    if (!currentUser) {
      guestToken = crypto.randomBytes(16).toString("hex");
    }

    const cart = await db.query.carts.findFirst({
      where: (carts, { and, eq, isNull }) =>
        currentUser
          ? eq(carts.userId, currentUser.id)
          : and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
      with: {
        cartItems: {
          with: {
            product: {
              with: {
                productMedia: {
                  columns: {
                    url: true,
                  },
                  where: (media, { eq }) => eq(media.isHero, false),
                  orderBy: (media, { asc }) => asc(media.sortOrder),
                  limit: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return badRequest("Your cart is empty.");
    }

    if (cart.cartItems.some((item) => !item.product.isActive)) {
      return badRequest(
        "Some items in your cart are no longer available, please review your cart",
      );
    }

    const calculateAmounts = (cartItems: typeof cart.cartItems) => {
      const items = cartItems.map((cartItem) => {
        const price = cartItem.product?.price ?? 0;
        const discountedPrice = cartItem.product?.discountedPrice ?? 0;
        const quantity = cartItem.quantity ?? 0;
        const originalAmount = Number(price) * quantity;
        const effectivePrice = Number(discountedPrice) || Number(price);
        const discountedAmount = effectivePrice * quantity;
        const discount = Number(originalAmount) - Number(discountedAmount);
        return { ...cartItem, originalAmount, discountedAmount, discount };
      });

      const originalAmount = items.reduce(
        (sum, item) => sum + item.originalAmount,
        0,
      );

      const discountAmount = items.reduce(
        (sum, item) => sum + item.discount,
        0,
      );
      const itemsTotal = originalAmount - discountAmount;

      const shippingCharge =
        itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

      const totalAmount = itemsTotal + shippingCharge;
      return {
        items,
        originalAmount,
        discountAmount,
        itemsTotal,
        shippingCharge,
        totalAmount,
      };
    };

    const {
      items,
      originalAmount,
      discountAmount,
      itemsTotal,
      shippingCharge,
      totalAmount,
    } = calculateAmounts(cart.cartItems);

    const newOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          userId: currentUser?.id ?? null,
          cartId: cart.id,
          originalAmount: originalAmount.toString(),
          discountAmount: discountAmount.toString(),
          itemsTotal: itemsTotal.toString(),
          shippingCharges: shippingCharge.toString(),
          totalAmount: totalAmount.toString(),
          paymentStatus: "pending",
          orderStatus: "not_placed",
          addressId: address?.id,
          guestToken: guestToken,
          shippingFullName: resolvedFullName,
          shippingPhone: resolvedPhone,
          shippingEmail: email,
          shippingAddressLine1: resolvedAddressLine1,
          shippingAddressLine2: resolvedAddressLine2,
          shippingCity: resolvedCity,
          shippingState: resolvedState,
          shippingPincode: resolvedPincode,
          shippingCountry: resolvedCountry,
        })
        .returning();

      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productTitle: item.product.title,
        productImageUrl: item.product.productMedia[0]?.url ?? "",
        size: item.size,
        quantity: item.quantity,
        // same effective-price rule as calculateAmounts: a zero/absent
        // discountedPrice falls back to the full price
        priceAtPurchase: (
          Number(item.product.discountedPrice) || Number(item.product.price)
        ).toFixed(2),
      }));

      await tx.insert(orderItems).values(orderItemsData);

      return order;
    });

    if (guestToken) {
      await setGuestOrderCookie({ orderId: newOrder.id, guestToken });
    }

    return created("Order created successfully", newOrder);
  } catch (error) {
    return internalServerError("Failed to create order", error);
  }
}
