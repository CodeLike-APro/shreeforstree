import z4 from "zod/v4";

export const mediaUploadSchema = z4
  .object({
    type: z4.enum(["avatar", "review"]),
    productId: z4.uuid().optional(),
  })
  .refine((data) => data.type !== "review" || !!data.productId, {
    message: "productId is required when type is review",
    path: ["productId"],
  });

export const adminMediaUploadSchema = z4
  .object({
    type: z4.enum(["product-gallery", "product-hero", "category"]),
    productId: z4.uuid().optional(),
    categorySlug: z4.string().optional(),
  })
  .refine((data) => data.type === "category" || !!data.productId, {
    message: "productId is required for product uploads",
    path: ["productId"],
  })
  .refine((data) => data.type !== "category" || !!data.categorySlug, {
    message: "categorySlug is required for category uploads",
    path: ["categorySlug"],
  });
