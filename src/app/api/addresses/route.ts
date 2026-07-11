import {
  badRequest,
  created,
  forbidden,
  internalServerError,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { createAddressSchema } from "@/lib/validators/address.validators";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return unauthorized("Please login to get your address details");
    }

    const userAddresses = await db.query.addresses.findMany({
      where: (addresses, { eq }) => eq(addresses.userId, currentUser.id),
      orderBy: (addresses, { desc }) => [
        desc(addresses.isDefault),
        desc(addresses.createdAt),
      ],
    });

    return ok("Address fetched successfully", userAddresses);
  } catch (error) {
    return internalServerError("Failed to fetch address", error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return unauthorized("Please login to get your address details");
    }

    const isAdmin = currentUser.role === "admin";

    if (!isAdmin) {
      return forbidden("You can only view & update your own address details");
    }

    const body = await request.json();
    const result = await createAddressSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = result.data;

    const newAddress = await db.transaction(async (tx) => {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, currentUser.id));

      const address = await tx
        .insert(addresses)
        .values({
          userId: currentUser.id,
          label: label.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2 ? addressLine2.trim() : null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          ...(country ? { country: country.trim() } : {}),
          isDefault,
        })
        .returning();
      return address;
    });

    return created("Address created successfully", newAddress);
  } catch (error) {
    return internalServerError("Failed to create address", error);
  }
}
