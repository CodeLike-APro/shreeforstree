import z4 from "zod/v4";
import { PRODUCT_SIZES } from "../db/schema";
import { MAX_CART_ITEMS } from "../constants";

export const addCartItemSchema = z4.object({
  productId: z4.uuid(),
  quantity: z4.number().int().min(1).max(MAX_CART_ITEMS),
  color: z4.string().min(1),
  size: z4.enum(PRODUCT_SIZES),
});

export const updateCartItemSchema = z4.object({
  quantity: z4.number().int().min(1).max(MAX_CART_ITEMS),
});
