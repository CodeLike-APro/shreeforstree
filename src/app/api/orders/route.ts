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
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  cartItems,
  orderItems,
  orders,
  orderStatusEnum,
} from "@/lib/db/schema";
import { createOrderSchema } from "@/lib/validators/order.validators";
import { and, count, eq, SQL } from "drizzle-orm";
import { NextRequest } from "next/server";

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

    const countResult = await db
      .select({ count: count() })
      .from(orders)
      .where(conditions.length ? and(...conditions) : undefined);

    const ordersData = await db.query.orders.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      limit,
      offset,
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

    if (!currentUser) {
      return unauthorized(
        "Unauthorized access. Please log in to create an order.",
      );
    }

    const body = await request.json();
    const result = await createOrderSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { addressId } = result.data;

    const address = await db.query.addresses.findFirst({
      where: (addresses, { eq }) => eq(addresses.id, addressId),
    });

    if (!address) {
      return notFound("Address not found");
    }

    if (address.userId !== currentUser.id) {
      return forbidden(
        "Unauthorized access. You can only use your own address.",
      );
    }

    const cart = await db.query.carts.findFirst({
      where: (carts, { eq }) => eq(carts.userId, currentUser.id),
      with: {
        cartItems: {
          with: {
            product: {
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
          userId: currentUser.id,
          originalAmount: originalAmount.toString(),
          discountAmount: discountAmount.toString(),
          itemsTotal: itemsTotal.toString(),
          shippingCharges: shippingCharge.toString(),
          totalAmount: totalAmount.toString(),
          orderStatus: "not_placed",
          paymentStatus: "pending",
          addressId: address.id,
          shippingFullName: address.fullName,
          shippingPhone: address.phone,
          shippingAddressLine1: address.addressLine1,
          shippingAddressLine2: address.addressLine2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPincode: address.pincode,
          shippingCountry: address.country,
        })
        .returning();

      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productTitle: item.product.title,
        productImageUrl: item.product.productMedia[0]?.url ?? "",
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        priceAtPurchase: item.product.discountedPrice ?? item.product.price,
      }));

      await tx.insert(orderItems).values(orderItemsData).returning();

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      return order;
    });

    return created("Order created successfully", newOrder);
  } catch (error) {
    return internalServerError("Failed to create order", error);
  }
}
