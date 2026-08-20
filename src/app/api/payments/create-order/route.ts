import {
  badRequest,
  created,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { createPaymentOrderSchema } from "@/lib/validators/payment.validator";
import { and, eq } from "drizzle-orm";
import type { Orders } from "razorpay/dist/types/orders";
import type { PgTransaction } from "drizzle-orm/pg-core";

type orderCreationResult = {
  kind:
    | "created"
    | "ok"
    | "badRequest"
    | "notFound"
    | "forbidden"
    | "internalServerError";
  message: string;
  error?: unknown;
  data?: {
    razorpayOrder?: Orders.RazorpayOrder;
    razorpayOrderId?: string;
    amount: string;
    currency: string;
    keyId?: string;
  };
};

const expirePaymentOrders = async (
  orderId: string,
  tx: PgTransaction<any, any, any>,
) => {
  await tx
    .update(payments)
    .set({ status: "expired" })
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "pending")));
};

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return unauthorized("Please login to create an order");
    }

    const body = await request.json();
    const result = await createPaymentOrderSchema.safeParseAsync(body);
    if (!result.success) {
      return badRequest(
        "Invalid payment order data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { orderId } = result.data;

    const createdOrder = await db.transaction(
      async (tx): Promise<orderCreationResult> => {
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .for("update");

        if (!order) {
          return { kind: "notFound", message: "Order not found" };
        }

        if (order.userId !== currentUser.id) {
          return {
            kind: "forbidden",
            message: "You are not the owner of this order",
          };
        }

        if (order.orderStatus !== "not_placed") {
          return {
            kind: "badRequest",
            message: "Order has already been placed",
          };
        }

        if (order.paymentStatus !== "pending") {
          return {
            kind: "badRequest",
            message: "Payment for this order is not pending",
          };
        }

        const existingPayment = await tx.query.payments.findFirst({
          where: (payments, { eq }) => eq(payments.orderId, order.id),
          orderBy: (payments, { desc }) => desc(payments.createdAt),
        });

        if (existingPayment?.status === "pending") {
          let razorpayOrder: Orders.RazorpayOrder | null = null;

          try {
            razorpayOrder = await razorpay.orders.fetch(
              existingPayment.razorpayOrderId,
            );
          } catch (error) {
            await expirePaymentOrders(order.id, tx);
            console.error("Error fetching Razorpay Order", error);
          }

          const canReuse =
            razorpayOrder !== null &&
            razorpayOrder.status === "created" &&
            Number(razorpayOrder.amount) ===
              Math.round(Number(order.totalAmount) * 100) &&
            razorpayOrder.currency === "INR";

          if (canReuse) {
            return {
              kind: "ok",
              message: "Payment order already exists",
              data: {
                razorpayOrder: razorpayOrder || undefined,
                razorpayOrderId: existingPayment.razorpayOrderId,
                amount: order.totalAmount,
                currency: "INR",
                keyId: process.env.RAZORPAY_KEY_ID!,
              },
            };
          }

          await expirePaymentOrders(order.id, tx);
        }

        if (existingPayment?.status === "success") {
          return {
            kind: "ok",
            message: "Payment already completed",
            data: {
              amount: order.totalAmount,
              currency: "INR",
            },
          };
        }

        await expirePaymentOrders(order.id, tx);

        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(Number(order.totalAmount) * 100),
          currency: "INR",
          receipt: order.id,
        });

        await tx
          .insert(payments)
          .values({
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            status: "pending",
            amount: order.totalAmount,
            provider: "razorpay",
            transactionId: null,
          })
          .returning();

        const returnData = {
          razorpayOrderId: razorpayOrder.id,
          amount: order.totalAmount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID!,
        };

        return {
          kind: "created",
          message: "Payment order created successfully",
          data: returnData,
        };
      },
    );

    switch (createdOrder.kind) {
      case "created":
        return created(createdOrder.message, createdOrder.data);
      case "ok":
        return ok(createdOrder.message, createdOrder.data);
      case "badRequest":
        return badRequest(createdOrder.message);
      case "notFound":
        return notFound(createdOrder.message);
      case "forbidden":
        return forbidden(createdOrder.message);
      case "internalServerError":
        return internalServerError(createdOrder.message, createdOrder.error);

      default: {
        const _exhaustive: never = createdOrder.kind;
        throw new Error(`Unhandled kind: ${_exhaustive}`);
      }
    }
  } catch (error) {
    return internalServerError(
      "An error occurred while creating the payment order",
      error,
    );
  }
}
