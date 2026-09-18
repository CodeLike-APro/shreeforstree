import type { createAddressSchema } from "@/lib/validators/address.validators";

export type AddressFieldErrors = Partial<
  Record<keyof typeof createAddressSchema.shape, string[]>
>;
