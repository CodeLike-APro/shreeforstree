import z4 from "zod/v4";
import { PRODUCT_SIZES } from "../db/schema";

export const createProductSchema = z4
  .object({
    title: z4.string().min(1, "Product title is required"),
    description: z4.string().min(1, "Product description is required"),
    price: z4.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid Price format"),
    discountedPrice: z4
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid Discounted Price format")
      .optional(),
    imagesUrl: z4
      .array(z4.string().min(1, "Image URL is required"))
      .min(1, "At least one image URL is required"),
    sizes: z4
      .array(z4.enum(PRODUCT_SIZES))
      .min(1, "At least one size is required"),
    colors: z4
      .array(z4.string().min(1, "Product color is required"))
      .min(1, "At least one color is required"),
    isActive: z4.boolean().optional(),
    isNewArrival: z4.boolean().optional(),
    isHeroProduct: z4.boolean().optional(),
    heroImageUrl: z4.string().min(1, "Hero image URL is required").optional(),
    categoryIds: z4.array(z4.uuid()).min(1),
  })
  .refine(
    (data) => (data.isHeroProduct ? !!data.heroImageUrl : !data.heroImageUrl),
    {
      message: "heroImageUrl is required when isHeroProduct is true",
      path: ["heroImageUrl"],
    },
  );

export const updateProductSchema = z4
  .object({
    title: z4.string().min(1, "Product title is required").optional(),
    description: z4
      .string()
      .min(1, "Product description is required")
      .optional(),
    price: z4
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid Price format")
      .optional(),
    discountedPrice: z4
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Invalid Discounted Price format")
      .optional(),
    imagesUrl: z4
      .array(z4.string().min(1, "Image URL is required"))
      .min(1, "At least one image URL is required")
      .optional(),
    sizes: z4
      .array(z4.enum(PRODUCT_SIZES))
      .min(1, "At least one size is required")
      .optional(),
    colors: z4
      .array(z4.string().min(1, "Product color is required"))
      .min(1, "At least one color is required")
      .optional(),
    isActive: z4.boolean().optional(),
    isNewArrival: z4.boolean().optional(),
    isHeroProduct: z4.boolean().optional(),
    heroImageUrl: z4.string().min(1, "Hero image URL is required").optional(),
    categoryIds: z4.array(z4.uuid()).min(1).optional(),
  })
  .refine((data) => !data.isHeroProduct || data.heroImageUrl, {
    message: "heroImageUrl is required when isHeroProduct is true",
    path: ["heroImageUrl"],
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
