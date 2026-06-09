import z4 from "zod/v4";

export const createCategorySchema = z4.object({
  name: z4.string().min(1, "Category name is required"),
  description: z4.string().min(1).optional(),
  categoryImageUrl: z4.string().min(1).optional(),
});

export const updateCategorySchema = z4
  .object({
    name: z4.string().min(1).optional(),
    description: z4.string().min(1).optional(),
    categoryImageUrl: z4.string().min(1).optional(),
    categoryImagePublicId: z4.string().min(1).optional(),
    isActive: z4.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasImageUrl = !!data.categoryImageUrl;
    const hasImagePublicId = !!data.categoryImagePublicId;

    if (hasImageUrl !== hasImagePublicId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryImageUrl"],
        message:
          "categoryImageUrl and categoryImagePublicId must be provided together",
      });

      ctx.addIssue({
        code: "custom",
        path: ["categoryImagePublicId"],
        message:
          "categoryImageUrl and categoryImagePublicId must be provided together",
      });
    }
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
