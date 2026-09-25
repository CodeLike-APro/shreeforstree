import * as z4 from "zod/v4";
import { PRODUCT_SIZES } from "../constants";

export const createProductSchema = z4.object({
  title: z4.string().min(1, "Product title is required"),
  description: z4.string().min(1, "Product description is required"),
  price: z4.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid Price format"),
  discountedPrice: z4
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid Discounted Price format")
    .optional(),
  sizes: z4
    .array(z4.enum(PRODUCT_SIZES))
    .min(1, "At least one size is required"),
  colors: z4
    .array(z4.string().min(1, "Product color is required"))
    .min(1, "At least one color is required"),
  isActive: z4.boolean().optional(),
  isNewArrival: z4.boolean().optional(),
  isHeroProduct: z4.boolean().optional(),
  fabric: z4.string().min(1),
  work: z4.array(z4.string().min(1)).optional(),
  silhouette: z4.string().min(1).optional().nullable(),
  lining: z4.string().min(1).optional().nullable(),
  sleeveType: z4.string().min(1).optional().nullable(),
  neckline: z4.string().min(1).optional().nullable(),
  length: z4.string().min(1).optional().nullable(),
  careInstructions: z4.string().min(1).optional().nullable(),
  keywords: z4.array(z4.string().min(1)).optional(),
  categoryIds: z4.array(z4.uuid()).min(1),
});

export const updateProductSchema = z4
  .object({
    title: z4.string().min(1).optional(),
    description: z4.string().min(1).optional(),
    price: z4
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid Price format")
      .optional(),
    discountedPrice: z4
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid Discounted Price format")
      .optional(),
    sizes: z4.array(z4.enum(PRODUCT_SIZES)).min(1).optional(),
    colors: z4.array(z4.string().min(1)).min(1).optional(),
    isActive: z4.boolean().optional(),
    isNewArrival: z4.boolean().optional(),
    isHeroProduct: z4.boolean().optional(),
    fabric: z4.string().min(1).optional(),
    work: z4.array(z4.string().min(1)).optional(),
    silhouette: z4.string().min(1).optional().nullable(),
    lining: z4.string().min(1).optional().nullable(),
    sleeveType: z4.string().min(1).optional().nullable(),
    neckline: z4.string().min(1).optional().nullable(),
    length: z4.string().min(1).optional().nullable(),
    careInstructions: z4.string().min(1).optional().nullable(),
    keywords: z4.array(z4.string().min(1)).optional(),
    categoryIds: z4.array(z4.uuid()).min(1).optional(),
    media: z4
      .array(
        z4.object({
          url: z4.string().min(1),
          path: z4.string().min(1),
          type: z4.enum(["image", "video"]),
          sortOrder: z4.number().int().min(0).max(9),
        }),
      )
      .max(10, "You can upload at most 10 media files")
      .optional(),
    fabricMedia: z4
      .array(
        z4.object({
          url: z4.string().min(1),
          path: z4.string().min(1),
          type: z4.enum(["image"]),
          sortOrder: z4.number().int().min(0).max(3),
        }),
      )
      .max(4)
      .optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).some(
        (key) => data[key as keyof typeof data] !== undefined,
      ),
    {
      message: "At least one field must be provided",
    },
  );
