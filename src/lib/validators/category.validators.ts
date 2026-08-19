import z4 from "zod/v4";

export const createCategorySchema = z4.object({
  title: z4.string().min(1, "Category title is required"),
  description: z4.string().min(1).optional(),
  isActive: z4.boolean().optional(),
});

export const updateCategorySchema = z4
  .object({
    title: z4.string().min(1).optional(),
    description: z4.string().min(1).optional(),
    isActive: z4.boolean().optional(),
    categoryImageUrl: z4.string().min(1).optional(),
    categoryImagePath: z4.string().min(1).optional(),
    sizeChartImageUrl: z4.string().min(1).optional(),
    sizeChartImagePath: z4.string().min(1).optional(),
  })
  .refine(
    ({ categoryImageUrl, categoryImagePath }) =>
      !!categoryImageUrl === !!categoryImagePath,
    {
      message:
        "categoryImageUrl and categoryImagePath must be provided together.",
      path: ["categoryImageUrl"],
    },
  )
  .refine(
    ({ sizeChartImageUrl, sizeChartImagePath }) =>
      !!sizeChartImageUrl === !!sizeChartImagePath,
    {
      message:
        "sizeChartImageUrl and sizeChartImagePath must be provided together.",
      path: ["sizeChartImageUrl"],
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
