import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { updateAddressSchema } from "@/lib/validators/address.validators";
import { eq } from "drizzle-orm";

const getAddressById = async (
  params: Promise<{ id: string }>,
  request: Request,
) => {
  const { id } = await params;
  const currentUser = await getCurrentUser(request);
  if (!currentUser || !("id" in currentUser)) {
    throw unauthorized("Please login to get your address details");
  }

  const address = await db.query.addresses.findFirst({
    where: (addresses, { eq }) => eq(addresses.id, id),
  });

  if (!address) {
    throw notFound("Address not found");
  }

  const isAdmin = currentUser.role === "admin";

  if (currentUser.id !== address.userId && !isAdmin) {
    throw forbidden("You can only view your own address details");
  }

  return { address, currentUser, isAdmin };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { address } = await getAddressById(params, request);
    return ok("Address fetched successfully", address);
  } catch (error) {
    if (error instanceof Response) return error;
    return internalServerError("Failed to fetch address", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const response = await getAddressById(params, request);

    const { address, currentUser } = response;

    const body = await request.json();

    const result = await updateAddressSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid address data",
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

    const updatedAddress = await db.transaction(async (tx) => {
      if (isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, currentUser.id));
      }

      const [updated] = await tx
        .update(addresses)
        .set({
          ...(label !== undefined && { label }),
          ...(fullName !== undefined && { fullName }),
          ...(phone !== undefined && { phone }),
          ...(addressLine1 !== undefined && { addressLine1 }),
          ...(addressLine2 && { addressLine2 }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(pincode !== undefined && { pincode }),
          ...(country !== undefined && { country }),
          ...(isDefault !== undefined && { isDefault }),
        })
        .where(eq(addresses.id, address.id))
        .returning();

      return updated;
    });
    return ok("Address updated successfully", updatedAddress);
  } catch (error) {
    if (error instanceof Response) return error;
    return internalServerError("Failed to update address", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { address } = await getAddressById(params, request);

    await db.delete(addresses).where(eq(addresses.id, address.id));

    return ok("Address deleted successfully");
  } catch (error) {
    if (error instanceof Response) return error;
    return internalServerError("Failed to delete address", error);
  }
}
