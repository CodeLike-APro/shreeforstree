import { badRequest, internalServerError, ok } from "@/lib/api-response";
import { db } from "@/lib/db";
import { cartItems, orders, payments } from "@/lib/db/schema";
import {
  RazorpayPaymentEntity,
  razorpayPaymentEntitySchema,
  razorpayWebhookEventSchema,
} from "@/lib/validators/payment.validator";
import crypto from "crypto";
import { eq } from "drizzle-orm";

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
      await handleCaptured(paymentEntity);
      return ok("Payment captured event processed successfully");
    } else {
      // Handle payment failed event
      console.log("Payment Failed Event:", paymentData);
      await handleFailed(paymentEntity);
      return ok("Payment failed event processed successfully");
    }
  } catch (error) {
    console.error("Error processing webhook", error);
    return internalServerError("Error processing webhook");
  }
}

async function handleCaptured(entity: RazorpayPaymentEntity): Promise<void> {
  const createdPaymentAndOrder = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, entity.order_id))
      .for("update");

    if (!payment) {
      console.warn("Payment not found for orderId:", entity.order_id);
      return { kind: "ok", message: "Payment not found" };
    }

    if (payment.status === "success") {
      console.info(
        "Payment already marked as success for orderId:",
        entity.order_id,
      );
      return {
        kind: "ok",
        message: "Payment already marked as success",
        data: { payment },
      };
    } else if (payment.status === "refunded") {
      console.warn(
        "Payment already marked as refunded for orderId:",
        entity.order_id,
      );
      return {
        kind: "ok",
        message: "Payment already marked as refunded",
        data: { payment },
      };
    } else if (payment.status !== "pending") {
      console.warn(
        `Payment status: ${payment.status},
        Payment ID: ${payment.id},
        Order ID: ${payment.orderId},
        Entity Order ID: ${entity.order_id}`,
      );
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update");

    if (!order) {
      console.warn("Order not found for orderId:", payment.orderId);
      return { kind: "ok", message: "Order not found" };
    }

    if (order.paymentStatus === "success") {
      console.warn(
        "Order already marked as success for orderId:",
        payment.orderId,
      );

      const [updatedOrder] = await tx
        .update(orders)
        .set({ refundRequired: true })
        .where(eq(orders.id, payment.orderId))
        .returning();

      return {
        kind: "ok",
        message: "Order already marked as success",
        data: { order: updatedOrder },
      };
    }

    if (
      Math.round(Number(entity.amount)) !==
      Math.round(Number(order.totalAmount) * 100)
    ) {
      console.error("Amount mismatch for orderId:", payment.orderId);
      return { kind: "ok", message: "Amount mismatch" };
    }

    if (entity.currency !== "INR") {
      console.error("Currency mismatch for orderId:", payment.orderId);
      return { kind: "ok", message: "Currency mismatch" };
    }

    const [existingTransactionId] = await tx
      .select()
      .from(payments)
      .where(eq(payments.transactionId, entity.id));

    if (existingTransactionId) {
      console.error(
        "Transaction ID already exists for orderId:",
        payment.orderId,
      );
      return { kind: "ok", message: "Transaction ID already exists" };
    }

    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: "success",
        transactionId: entity.id,
        method: entity.method ?? null,
        failureReason: null,
      })
      .where(eq(payments.id, payment.id))
      .returning();

    const [updatedOrder] = await tx
      .update(orders)
      .set({ paymentStatus: "success", orderStatus: "placed" })
      .where(eq(orders.id, payment.orderId))
      .returning();

    if (!updatedPayment || !updatedOrder) {
      throw new Error(
        `Failed to update ${!updatedPayment ? "payment" : "order"}`,
      );
    }

    if (updatedOrder.cartId) {
      await tx
        .delete(cartItems)
        .where(eq(cartItems.cartId, updatedOrder.cartId));
    }

    return {
      kind: "ok",
      message: "Payment and order updated successfully",
      data: { payment: updatedPayment, order: updatedOrder },
    };
  });

  const infoData = JSON.stringify(createdPaymentAndOrder.data);
  console.log("Payment and Order Update Info:");
  console.log(infoData);

  console.info(
    `Kind: ${createdPaymentAndOrder.kind}, Message: ${createdPaymentAndOrder.message}, Data: ${infoData}`,
  );

  //TODO: Add logic to send confirmation email to the user after successful payment and order placement.
}

const nonEmptyString = ({
  string,
}: {
  string: Array<string | null | undefined>;
}): string | null => {
  const nonEmpty = string.find(
    (s): s is string =>
      typeof s === "string" && s.trim().slice(0, 240).length > 0,
  );
  return nonEmpty?.trim().slice(0, 240) ?? null;
};

async function handleFailed(entity: RazorpayPaymentEntity): Promise<void> {
  const createdPaymentAndOrder = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, entity.order_id))
      .for("update");

    if (!payment) {
      console.warn("Payment not found for orderId:", entity.order_id);
      return { kind: "ok", message: "Payment not found" };
    }

    if (payment.status === "success" || payment.status === "refunded") {
      console.info(
        `Payment already marked as ${payment.status} for orderId:`,
        entity.order_id,
      );
      return {
        kind: "ok",
        message: `Payment already marked as ${payment.status}`,
        data: { payment },
      };
    }

    const [existingTransactionId] = await tx
      .select()
      .from(payments)
      .where(eq(payments.transactionId, entity.id));

    if (existingTransactionId) {
      console.error(
        "Transaction ID already exists for orderId:",
        payment.orderId,
      );
      return { kind: "ok", message: "Transaction ID already exists" };
    }

    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: "failed",
        transactionId: entity.id,
        method: entity.method ?? null,
        failureReason:
          nonEmptyString({
            string: [
              entity.error_description,
              entity.error_reason,
              entity.error_code,
            ],
          }) ?? "The payment failed due to an unknown reason.",
      })
      .where(eq(payments.id, payment.id))
      .returning();

    if (!updatedPayment) {
      console.error("Failed to update payment for orderId:", payment.orderId);
      throw new Error("Failed to update payment");
    }

    return {
      kind: "ok",
      message: "Payment marked as failed",
      data: { payment: updatedPayment },
    };
  });

  console.info(
    `Kind: ${createdPaymentAndOrder.kind}, Message: ${createdPaymentAndOrder.message}, Data: ${JSON.stringify(createdPaymentAndOrder.data)}`,
  );
}
