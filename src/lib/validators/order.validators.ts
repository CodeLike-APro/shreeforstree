import z4 from "zod/v4";

export const createOrderSchema = z4
  .object({
    email: z4.email({ error: "Invalid email address" }),
    addressId: z4.uuid({ error: "Invalid address ID" }).optional(),
    shippingFullName: z4.string().min(2).max(100).optional(),
    shippingPhone: z4.string().min(10).optional(),
    shippingAddressLine1: z4.string().min(2).max(255).optional(),
    shippingAddressLine2: z4.string().max(255).optional(),
    shippingCity: z4.string().max(100).optional(),
    shippingState: z4.string().max(100).optional(),
    shippingPincode: z4.string().min(6).optional(),
    shippingCountry: z4.string().max(100).optional().default("India"),
  })
  .refine((data) => {
    // If addressId is not provided, all shipping fields must be provided
    if (!data.addressId) {
      return (
        data.shippingFullName &&
        data.shippingPhone &&
        data.shippingAddressLine1 &&
        data.shippingCity &&
        data.shippingState &&
        data.shippingPincode &&
        data.shippingCountry
      );
    }
    return true;
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
