import { and, count, eq } from "drizzle-orm";
import {
  badRequest,
  created,
  internalServerError,
  paginated,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { createAddressSchema } from "@/lib/validators/address.validators";

import type { SQL } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return unauthorized("Please login to get your address details");
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(
      1,
      parseInt(searchParams.get("limit") ?? "10") || 10,
    );
    const offset = (page - 1) * limit;

    const isAdmin = currentUser.role === "admin";
    const userId = searchParams.get("userId");

    const conditions: SQL[] = [];

    if (isAdmin) {
      if (userId) {
        conditions.push(eq(addresses.userId, userId));
      }
    } else {
      conditions.push(eq(addresses.userId, currentUser.id));
    }

    const countResult = await db
      .select({ count: count() })
      .from(addresses)
      .where(conditions.length ? and(...conditions) : undefined);

    const userAddresses = await db.query.addresses.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: (addresses, { desc }) => [
        desc(addresses.isDefault),
        desc(addresses.createdAt),
      ],
      limit,
      offset,
    });

    return paginated(
      "Address fetched successfully",
      userAddresses,
      countResult[0].count,
      page,
      limit,
    );
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
      if (isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, currentUser.id));
      }

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
