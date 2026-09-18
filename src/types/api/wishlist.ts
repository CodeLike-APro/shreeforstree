import type { Product, ProductMedia } from "../models";

export type WishlistEntry = {
  addedAt: Date;
  product: Pick<
    Product,
    "id" | "title" | "price" | "discountedPrice" | "slug"
  > & { productMedia: ProductMedia[] };
};
