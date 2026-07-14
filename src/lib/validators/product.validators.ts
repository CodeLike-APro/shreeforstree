import z4 from "zod/v4";
import { PRODUCT_SIZES } from "../db/schema";

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

    categoryIds: z4.array(z4.uuid()).min(1).optional(),
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
