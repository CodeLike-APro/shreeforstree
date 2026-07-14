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
import { eq } from "drizzle-orm";

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

    if (payment.status === "success") {
      return badRequest("Payment has already been verified");
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
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.id, payment.id));
      return badRequest("Payment verification failed");
    }

    const paymentdetails = await razorpay.payments.fetch(razorpayPaymentId);

    const updatedPaymentsAndOrders = await db.transaction(async (tx) => {
      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: "success",
          transactionId: razorpayPaymentId,
          method: paymentdetails.method ?? null,
        })
        .where(eq(payments.id, payment.id))
        .returning();

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
