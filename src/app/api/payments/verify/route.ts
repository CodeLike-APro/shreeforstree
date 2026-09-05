import {
  badRequest,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import {
  assertOrderOwnership,
  assertPaymentValid,
  getCurrentUser,
} from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";
import { resolveGuestToken } from "@/lib/order-utils";
import { razorpay } from "@/lib/razorpay";
import { handleResponse } from "@/lib/response-handler";
import { verifyPaymentSchema } from "@/lib/validators/payment.validator";
import crypto from "crypto";
import { and, eq, ne } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const body = await request.json();
    const result = await verifyPaymentSchema.safeParseAsync(body);
    if (!result.success) {
      return badRequest(
        "Invalid payment verification data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      guestToken,
    } = result.data;

    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    if (!order) {
      return notFound("Order not found");
    }

    const token = await resolveGuestToken(orderId, guestToken);

    const ownershipCheck = await assertOrderOwnership(
      order,
      currentUser?.id,
      token,
    );

    const ownershipResponse = handleResponse(ownershipCheck);

    if (ownershipResponse.status !== 200) {
      return ownershipResponse;
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
        userId: currentUser?.id,
      });
      return badRequest("Payment verification failed");
    }

    const paymentdetails = await razorpay.payments.fetch(razorpayPaymentId);

    const validation = assertPaymentValid(
      paymentdetails,
      order,
      razorpayOrderId,
    );

    const validationResponse = handleResponse(validation);

    if (validationResponse.status !== 200) {
      console.error("Payment validation failed", {
        orderId: order.id,
        reason: validation.message,
      });
      return validationResponse;
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
