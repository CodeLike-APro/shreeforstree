import {
  badRequest,
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return unauthorized("Please login to get your address details");
    }

    const isAdmin = currentUser?.role === "admin";

    if (currentUser.id !== id && !isAdmin) {
      return forbidden("You can only view your own address details");
    }

    const addresses = await db.query.addresses.findMany({
      where: (address, { eq }) => eq(address.userId, id),
    });

    return ok("Address fetched successfully", addresses);
  } catch (error) {
    return internalServerError("Failed to fetch address", error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return unauthorized("Please login to get your address details");
    }

    const isAdmin = currentUser.role === "admin";

    if (currentUser.id !== id && !isAdmin) {
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
        .where(eq(addresses.userId, id));

      const address = await tx
        .insert(addresses)
        .values({
          userId: id,
          label: label.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2 ? addressLine2.trim() : null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim(),
          isDefault,
        })
        .returning();
      return address;
    });

    return ok("Address created successfully", newAddress);
  } catch (error) {
    return internalServerError("Failed to create address", error);
  }
}
