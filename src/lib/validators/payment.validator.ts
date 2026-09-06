import z4 from "zod/v4";

export const createPaymentOrderSchema = z4.object({
  orderId: z4.uuid(),
  guestToken: z4.string().min(1).optional(),
});

export const confirmPaymentSchema = z4.object({
  razorpayOrderId: z4.string().min(1),
  razorpayPaymentId: z4.string().min(1),
  razorpaySignature: z4.string().min(1),
  orderId: z4.uuid(),
  guestToken: z4.string().min(1).optional(),
});

export const razorpayWebhookEventSchema = z4.object({
  event: z4.string().min(1),
});

export const razorpayPaymentEntitySchema = z4.object({
  id: z4.string().min(1),
  order_id: z4.string().min(1),
  amount: z4.union([
    z4.number().int().nonnegative(),
    z4.string().regex(/^\d+$/),
  ]),
  currency: z4.string(),
  method: z4.string().nullish(),
  error_code: z4.string().nullish(),
  error_description: z4.string().nullish(),
  error_reason: z4.string().nullish(),
});

export type RazorpayPaymentEntity = z4.infer<
  typeof razorpayPaymentEntitySchema
>;
