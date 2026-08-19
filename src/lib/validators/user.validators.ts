import z4 from "zod/v4";

export const updateUserSchema = z4
  .object({
    name: z4.string().min(1, "Name is required").optional(),
    phone: z4
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(10, "Phone number must be at most 10 digits")
      .optional(),
    role: z4.enum(["user", "admin"]).optional(),
    image: z4.string().min(1, "Image URL is required").optional(),
    imagePath: z4.string().min(1, "Image path is required").optional(),
  })
  .refine(({ image, imagePath }) => !!image === !!imagePath, {
    message: "Image URL and Image path must have the same number of items.",
    path: ["image"],
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
