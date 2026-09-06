import { badRequest, internalServerError, ok } from "@/lib/api-response";
import {
  razorpayPaymentEntitySchema,
  razorpayWebhookEventSchema,
} from "@/lib/validators/payment.validator";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const payload = await request.text();

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET environment variable");
      return internalServerError(
        "Missing RAZORPAY_WEBHOOK_SECRET environment variable",
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    const signatureHeader = request.headers.get("x-razorpay-signature");

    if (!signatureHeader) {
      console.error("Missing signature header");
      return badRequest("Missing signature header");
    }

    const isValid =
      expectedSignature.length === signatureHeader.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signatureHeader, "utf-8"),
      );

    if (!isValid) {
      console.error("Invalid Payment Signature");
      return badRequest("Invalid webhook signature");
    }

    const body = JSON.parse(payload);

    const result = razorpayWebhookEventSchema.safeParse(body);

    if (!result.success) {
      console.error(
        "Parsed webhook event:",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
      return ok("Webhook event ignored");
    }

    const event = result.data.event;

    if (!["payment.captured", "payment.failed"].includes(event)) {
      console.info("Event ignored:", event);
      return ok("Event ignored");
    }

    const parsedPaymentEntity = razorpayPaymentEntitySchema.safeParse(
      body?.payload?.payment?.entity,
    );

    if (!parsedPaymentEntity.success) {
      console.error(
        "Parsed payment entity:",
        parsedPaymentEntity,
        "Error:-",
        parsedPaymentEntity.error.flatten((issue) => issue.message).fieldErrors,
      );
      return ok("Payment entity ignored");
    }

    const paymentEntity = parsedPaymentEntity.data;

    const paymentData = {
      event,
      razorpayOrderId: paymentEntity.order_id,
      razorpayPaymentId: paymentEntity.id,
    };

    // Process the payment entity based on the event type
    if (event === "payment.captured") {
      // Handle payment captured event
      console.log("Payment Captured Event:", paymentData);
      return ok("Payment captured event processed successfully");
    } else {
      // Handle payment failed event
      console.log("Payment Failed Event:", paymentData);
      return ok("Payment failed event processed successfully");
    }
  } catch (error) {
    console.error("Error processing webhook", error);
    return internalServerError("Error processing webhook");
  }
}
