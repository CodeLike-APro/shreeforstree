import z4 from "zod/v4";

export const createAddressSchema = z4.object({
  label: z4.string().min(1, "Label is required"),
  fullName: z4.string().min(1, "Full name is required"),
  phone: z4.string().min(1, "Phone number is required"),
  addressLine1: z4.string().min(1, "Address line 1 is required"),
  addressLine2: z4.string().optional(),
  city: z4.string().min(1, "City is required"),
  state: z4.string().min(1, "State is required"),
  pincode: z4.string().min(1, "Pincode is required"),
  country: z4
    .string()
    .min(1, "Country is required")
    .optional()
    .default("India"),
  isDefault: z4.boolean().optional().default(true),
});

export const updateAddressSchema = z4
  .object({
    label: z4.string().min(1).optional(),
    fullName: z4.string().min(1).optional(),
    phone: z4.string().min(1).optional(),
    addressLine1: z4.string().min(1).optional(),
    addressLine2: z4.string().optional(),
    city: z4.string().min(1).optional(),
    state: z4.string().min(1).optional(),
    pincode: z4.string().min(1).optional(),
    country: z4.string().min(1).default("India").optional(),
    isDefault: z4.boolean().optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).some(
        (key) => data[key as keyof typeof data] != undefined,
      ),
    {
      message: "At least one field must be provided",
    },
  );
