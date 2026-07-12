import z4 from "zod/v4";
import { PRODUCT_SIZES } from "../db/schema";

export const addCartItemSchema = z4.object({
  productId: z4.string().uuid(),
  quantity: z4.number().int().min(1).max(10),
  color: z4.string().min(1),
  size: z4.enum(PRODUCT_SIZES),
});

export const updateCartItemSchema = z4.object({
  quantity: z4.number().int().min(1).max(10),
});
