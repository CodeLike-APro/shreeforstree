import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck, getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { account, session, user } from "@/lib/db/schema/auth.schema";
import { updateUserSchema } from "@/lib/validators/user.validators";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return badRequest("Please login to get your account details");
    }

    if (currentUser.id !== id && !(await adminCheck(request))) {
      return forbidden("You can only view your own account details");
    }

    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!foundUser || foundUser.deletedAt) {
      return notFound("User not found");
    }

    return ok("User fetched successfully", foundUser);
  } catch (error) {
    return internalServerError("Failed to fetch user", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return badRequest("Please login to update your account");
    }

    if (currentUser.id !== id && !(await adminCheck(request))) {
      return forbidden("You can only update your own account");
    }

    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!foundUser || foundUser.deletedAt) {
      return notFound("User not found");
    }

    const { phone } = await request.json();

    const result = await updateUserSchema.safeParseAsync({ phone });

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const updatedUser = await db
      .update(user)
      .set({
        ...(phone && { phone: phone.trim() }),
      })
      .where(eq(user.id, id))
      .returning();

    return ok("User updated successfully", updatedUser);
  } catch (error) {
    return internalServerError("Failed to update user", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser || !("id" in currentUser)) {
      return badRequest("Please login to delete your account");
    }

    if (currentUser.id !== id && !(await adminCheck(request))) {
      return forbidden("You can only delete your own account");
    }

    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!foundUser || foundUser.deletedAt) {
      return notFound("User not found");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          name: "Deleted User",
          phone: null,
          email: `deleted_${foundUser.id}@deleted.local`,
          emailVerified: false,
          image: null,
          deletedAt: new Date(),
        })
        .where(eq(user.id, id))
        .returning();

      await tx.delete(account).where(eq(account.userId, id)).returning();
      await tx.delete(session).where(eq(session.userId, id)).returning();
      return;
    });

    return ok("User deleted successfully");
  } catch (error) {
    return internalServerError("Failed to delete user", error);
  }
}
