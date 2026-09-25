import * as z4 from "zod/v4";

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
    type: z4.enum([
      "product-gallery",
      "product-hero",
      "product-fabric",
      "category",
      "category-size-chart",
    ]),
    productId: z4.uuid().optional(),
    categorySlug: z4.string().optional(),
    keepCount: z4.coerce.number().int().min(0).optional(),
  })
  .refine(
    (data) =>
      data.type === "category" ||
      data.type === "category-size-chart" ||
      !!data.productId,
    {
      message: "productId is required for product uploads",
      path: ["productId"],
    },
  )
  .refine(
    (data) =>
      !(data.type === "category" || data.type === "category-size-chart") ||
      !!data.categorySlug,
    {
      message: "categorySlug is required for category uploads",
      path: ["categorySlug"],
    },
  )
  .refine(
    (data) =>
      data.keepCount === undefined ||
      data.type === "product-gallery" ||
      data.type === "product-fabric",
    {
      message:
        "keepCount is only applicable to product-gallery and product-fabric uploads",
      path: ["keepCount"],
    },
  );
