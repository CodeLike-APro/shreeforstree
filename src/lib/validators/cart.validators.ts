import * as z4 from "zod/v4";
import { MAX_CART_ITEMS, PRODUCT_SIZES } from "../constants";

export const addCartItemSchema = z4.object({
  productId: z4.uuid(),
  quantity: z4.number().int().min(1).max(MAX_CART_ITEMS),
  size: z4.enum(PRODUCT_SIZES),
});

export const updateCartItemSchema = z4.object({
  quantity: z4.number().int().min(1).max(MAX_CART_ITEMS),
});
