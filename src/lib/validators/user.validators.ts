import z4 from "zod/v4";

export const updateUserSchema = z4.object({
  phone: z4
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(10, "Phone number must be at most 10 digits")
    .optional(),
});
