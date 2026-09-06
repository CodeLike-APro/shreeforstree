import {
  badRequest,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { assertOrderOwnership, getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { resolveGuestToken } from "@/lib/order-utils";
import { handleResponse } from "@/lib/response-handler";
import { confirmPaymentSchema } from "@/lib/validators/payment.validator";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const body = await request.json();
    const result = await confirmPaymentSchema.safeParseAsync(body);
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
      console.error("Invalid Payment Signature");
    }

    console.info(
      `Payment verified ${isValid ? "successfully" : "unsuccessfully"}`,
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        signatureVerified: isValid,
      },
    );

    return ok("Payment received, confirming", { orderId });
  } catch (error) {
    return internalServerError(
      "An error occurred while verifying the payment",
      error,
    );
  }
}
