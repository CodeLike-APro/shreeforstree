import { badRequest, internalServerError } from "@/lib/api-response";
import { assertOrderOwnership, getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { createPaymentOrderSchema } from "@/lib/validators/payment.validator";
import { and, eq, ExtractTablesWithRelations } from "drizzle-orm";
import type { Orders } from "razorpay/dist/types/orders";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import { handleResponse } from "@/lib/response-handler";
import * as schema from "@/lib/db/schema/index";
import { resolveGuestToken } from "@/lib/order-utils";

type Transaction = PgTransaction<
  NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type OrderCreationData = {
  razorpayOrder?: Orders.RazorpayOrder;
  razorpayOrderId?: string;
  amount: string;
  currency: string;
  keyId?: string;
};

type orderCreationResult =
  | { kind: "created"; message: string; data: OrderCreationData }
  | { kind: "ok"; message: string; data: OrderCreationData }
  | { kind: "badRequest"; message: string }
  | { kind: "notFound"; message: string }
  | { kind: "forbidden"; message: string }
  | { kind: "internalServerError"; message: string; error?: unknown };

const expirePaymentOrders = async (orderId: string, tx: Transaction) => {
  await tx
    .update(payments)
    .set({ status: "expired" })
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "pending")));
};

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const body = await request.json();
    const result = await createPaymentOrderSchema.safeParseAsync(body);
    if (!result.success) {
      return badRequest(
        "Invalid payment order data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }
    const { orderId, guestToken } = result.data;

    const token = await resolveGuestToken(orderId, guestToken);

    const createdOrder: orderCreationResult = await db.transaction(
      async (tx) => {
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .for("update");

        if (!order) {
          return { kind: "notFound", message: "Order not found" };
        }

        const ownershipCheck = await assertOrderOwnership(
          order,
          currentUser?.id,
          token,
        );

        if (ownershipCheck.kind === "forbidden") {
          return {
            kind: "forbidden",
            message: ownershipCheck.message,
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
                name: order.shippingFullName,
                email: order.shippingEmail,
                contact: order.shippingPhone,
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
          payment_capture: true,
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
          name: order.shippingFullName,
          email: order.shippingEmail,
          contact: order.shippingPhone,
        };

        return {
          kind: "created",
          message: "Payment order created successfully",
          data: returnData,
        };
      },
    );

    return handleResponse(createdOrder);
  } catch (error) {
    return internalServerError(
      "An error occurred while creating the payment order",
      error,
    );
  }
}
