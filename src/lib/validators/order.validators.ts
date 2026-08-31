import z4 from "zod/v4";

export const createOrderSchema = z4.object({
  email: z4.email({ error: "Invalid email address" }),
  addressId: z4.uuid({ error: "Invalid address ID" }).optional(),
  shippingFullName: z4.string().min(2).max(100).optional(),
  shippingPhone: z4.string().optional(),
  shippingEmail: z4.string().optional(),
  shippingAddressLine1: z4.string().optional(),
  shippingAddressLine2: z4.string().optional(),
  shippingCity: z4.string().optional(),
  shippingState: z4.string().optional(),
  shippingPincode: z4.string().optional(),
  shippingCountry: z4.string().optional(),
});
export const updateOrderSchema = z4.object({
  orderStatus: z4.enum([
    "placed",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ]),
});
