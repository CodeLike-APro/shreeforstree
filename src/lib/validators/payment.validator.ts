import z4 from "zod/v4";

export const createPaymentOrderSchema = z4.object({
  orderId: z4.uuid(),
});

export const verifyPaymentSchema = z4.object({
  razorpayOrderId: z4.string().min(1),
  razorpayPaymentId: z4.string().min(1),
  razorpaySignature: z4.string().min(1),
  orderId: z4.uuid(),
});
