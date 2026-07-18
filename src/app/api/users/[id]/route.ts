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
import { account, session, user } from "@/lib/db/schema/auth.schema";
import { deleteFile } from "@/lib/media/media-handle";
import { isOwnedMediaPath } from "@/lib/media/path-guard";
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
      return unauthorized("Please login to get your account details");
    }

    const isAdmin = currentUser.role === "admin";

    if (currentUser.id !== id && !isAdmin) {
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
      return unauthorized("Please login to update your account");
    }

    const isAdmin = currentUser.role === "admin";

    if (currentUser.id !== id && !isAdmin) {
      return forbidden("You can only update your own account");
    }

    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!foundUser || foundUser.deletedAt) {
      return notFound("User not found");
    }

    const body = await request.json();

    const result = await updateUserSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { name, phone, role, image, imagePath } = result.data;

    if (role !== undefined) {
      if (!isAdmin) return forbidden("Only admins can update user role");
    }

    // imagePath is later passed to deleteFile on avatar replacement/account
    // deletion — restrict it to the target user's own avatar folder
    if (imagePath !== undefined && !isOwnedMediaPath(imagePath, `avatars/${id}`)) {
      return badRequest("imagePath must point to this user's avatar folder");
    }

    const updatedUser = await db
      .update(user)
      .set({
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(role !== undefined && { role }),
        ...(image && { image: image.trim() }),
        ...(imagePath && { image_path: imagePath.trim() }),
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
      return unauthorized("Please login to delete your account");
    }

    const isAdmin = currentUser.role === "admin";

    if (currentUser.id !== id && !isAdmin) {
      return forbidden("You can only delete your own account");
    }

    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!foundUser || foundUser.deletedAt) {
      return notFound("User not found");
    }

    const imagePath = foundUser.image_path;

    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          name: "Deleted User",
          phone: null,
          email: `deleted_${foundUser.id}@deleted.local`,
          emailVerified: false,
          image: null,
          image_path: null,
          deletedAt: new Date(),
        })
        .where(eq(user.id, id));

      await tx.delete(account).where(eq(account.userId, id));
      await tx.delete(session).where(eq(session.userId, id));
    });

    // storage cleanup only after the anonymization committed; failures must
    // never block the account deletion
    try {
      if (imagePath) {
        await deleteFile(imagePath);
      }
    } catch (error) {
      console.error("Failed to delete user image", error);
    }

    return ok("User deleted successfully");
  } catch (error) {
    return internalServerError("Failed to delete user", error);
  }
}
