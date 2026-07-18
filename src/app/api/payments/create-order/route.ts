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
import { payments } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { createPaymentOrderSchema } from "@/lib/validators/payment.validator";
import { eq } from "drizzle-orm";

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

    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    if (!order) {
      return notFound("Order not found");
    }

    if (order.userId !== currentUser.id) {
      return forbidden("You are not the owner of this order");
    }

    if (order.orderStatus !== "not_placed") {
      return badRequest("Order has already been placed");
    }

    if (order.paymentStatus !== "pending") {
      return badRequest("Payment for this order is not pending");
    }

    const existingPayment = await db.query.payments.findFirst({
      where: (payments, { eq }) => eq(payments.orderId, order.id),
    });

    if (existingPayment?.status === "pending") {
      // return existing razorpay order instead of creating new one
      return ok("Payment order already exists", {
        razorpayOrderId: existingPayment.razorpayOrderId,
        amount: order.totalAmount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.totalAmount) * 100), // paise
      currency: "INR",
      receipt: order.id,
    });

    if (existingPayment) {
      // reuse the existing row (orderId is unique) instead of inserting a
      // second one, which would violate the unique constraint
      await db
        .update(payments)
        .set({
          razorpayOrderId: razorpayOrder.id,
          status: "pending",
          amount: order.totalAmount,
          transactionId: null,
          method: null,
        })
        .where(eq(payments.id, existingPayment.id));
    } else {
      await db.insert(payments).values({
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        status: "pending",
        amount: order.totalAmount,
        provider: "razorpay",
        transactionId: null,
      });
    }

    const returnData = {
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };

    return created("Created Razorpay order", returnData);
  } catch (error) {
    return internalServerError(
      "An error occurred while creating the payment order",
      error,
    );
  }
}
