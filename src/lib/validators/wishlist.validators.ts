import * as z4 from "zod/v4";

export const addWishlistSchema = z4.object({
  productId: z4.uuid("Product ID must be a valid UUID"),
});
