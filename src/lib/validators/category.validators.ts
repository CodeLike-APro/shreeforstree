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
