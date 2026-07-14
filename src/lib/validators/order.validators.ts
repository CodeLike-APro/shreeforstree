import z4 from "zod/v4";

export const createOrderSchema = z4.object({
  addressId: z4.uuid({ error: "Invalid address ID" }),
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
