import z4 from "zod/v4";

export const createCategorySchema = z4.object({
  name: z4.string().min(1, "Category name is required"),
  description: z4.string().min(1).optional(),
  isActive: z4.boolean().optional(),
});

export const updateCategorySchema = z4
  .object({
    name: z4.string().min(1).optional(),
    description: z4.string().min(1).optional(),
    isActive: z4.boolean().optional(),
    categoryImageUrl: z4.string().min(1).optional(),
    categoryImagePath: z4.string().min(1).optional(),
  })
  .refine(
    ({ categoryImageUrl, categoryImagePath }) =>
      !!categoryImageUrl === !!categoryImagePath,
    {
      message:
        "Category Image URL and Category Image Path must have the same number of items.",
      path: ["categoryImageUrl"],
    },
  )
  .refine(
    (data) =>
      Object.keys(data).some(
        (key) => data[key as keyof typeof data] !== undefined,
      ),
    {
      message: "At least one field must be provided",
    },
  );
