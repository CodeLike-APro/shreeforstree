import {
  badRequest,
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
import { verifyPaymentSchema } from "@/lib/validators/payment.validator";
import crypto from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { Payments } from "razorpay/dist/types/payments";

type ValidationResult = { ok: true } | { ok: false; reason: string };

const assertPaymentValid = (
  paymentdetails: Payments.RazorpayPayment,
  order: typeof orders.$inferSelect,
  razorpayOrderId: string,
): ValidationResult => {
  if (paymentdetails.order_id !== razorpayOrderId) {
    return { ok: false, reason: "Payment does not belong to this order" };
  }

  if (paymentdetails.status !== "captured") {
    return { ok: false, reason: "Payment not captured" };
  }

  if (
    Number(paymentdetails.amount) !==
      Math.round(Number(order.totalAmount) * 100) ||
    paymentdetails.currency !== "INR"
  ) {
    return { ok: false, reason: "Payment amount mismatch" };
  }

  return { ok: true };
};

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return unauthorized("Please login to verify the payment");
    }

    const body = await request.json();
    const result = await verifyPaymentSchema.safeParseAsync(body);
    if (!result.success) {
      return badRequest(
        "Invalid payment verification data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      result.data;

    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    if (!order) {
      return notFound("Order not found");
    }

    if (order.userId !== currentUser.id) {
      return forbidden("You are not the owner of this order");
    }

    const payment = await db.query.payments.findFirst({
      where: (payments, { eq }) =>
        eq(payments.razorpayOrderId, razorpayOrderId),
    });

    if (!payment) {
      return notFound(
        "Payment record not found for the given Razorpay Order ID",
      );
    }

    if (payment.orderId !== order.id) {
      return badRequest("Payment does not belong to this order");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid =
      expectedSignature.length === razorpaySignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(razorpaySignature, "utf-8"),
      );

    if (!isValid) {
      console.error("Invalid Payment Signature", {
        orderId: orderId,
        razorpayOrderId: razorpayOrderId,
        userId: currentUser.id,
      });
      return badRequest("Payment verification failed");
    }

    const paymentdetails = await razorpay.payments.fetch(razorpayPaymentId);

    const validation = assertPaymentValid(
      paymentdetails,
      order,
      razorpayOrderId,
    );

    if (!validation.ok) {
      console.error("Payment velidation failed", {
        orderId: order.id,
        reason: validation.reason,
      });
      return badRequest(validation.reason);
    }

    const updatedPaymentsAndOrders = await db.transaction(async (tx) => {
      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: "success",
          transactionId: razorpayPaymentId,
          method: paymentdetails.method ?? null,
        })
        .where(and(eq(payments.id, payment.id), ne(payments.status, "success")))
        .returning();

      if (!updatedPayment) {
        return null;
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          paymentStatus: "success",
          orderStatus: "placed",
        })
        .where(eq(orders.id, order.id))
        .returning();

      return { updatedPayment, updatedOrder };
    });

    return ok("Payment verified successfully", updatedPaymentsAndOrders);
  } catch (error) {
    return internalServerError(
      "An error occurred while verifying the payment",
      error,
    );
  }
}
