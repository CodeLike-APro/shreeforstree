import { and, eq, inArray } from "drizzle-orm";
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
import { orderItems, orders, user } from "@/lib/db/schema";
import {
  deleteFiles,
  detectMediaType,
  uploadFiles,
  uploadSingleFile,
} from "@/lib/media/media-handle";
import { mediaUploadSchema } from "@/lib/validators/media.validators";

import type { AvatarUploadData, UploadedMedia } from "@/types/api/media";
import type { NextRequest } from "next/server";

const MAX_FILES: Record<"avatar" | "review", number> = {
  avatar: 1,
  review: 5,
};

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Please login to upload media");
    }

    const formData = await request.formData();

    const result = await mediaUploadSchema.safeParseAsync({
      type: formData.get("type"),
      productId: formData.get("productId") ?? undefined,
    });

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { type, productId } = result.data;

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return badRequest("At least one file is required");
    }

    const maxFiles = MAX_FILES[type];
    if (files.length > maxFiles) {
      return badRequest(
        `You can upload at most ${maxFiles} file(s) for ${type}`,
      );
    }

    const mediaTypes = await Promise.all(files.map((f) => detectMediaType(f)));
    if (mediaTypes.some((m) => !m.isImage)) {
      return badRequest("Only image files are allowed");
    }
    if (type === "avatar") {
      const folder = `avatars/${currentUser.id}`;

      const existing = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, currentUser.id),
        columns: { image_path: true },
      });

      // upload the replacement and point the DB at it first — only then
      // delete the old file, so a failed upload can't leave the stored
      // image/image_path referencing a deleted file
      const uploaded = await uploadSingleFile(files[0], folder);

      const [updatedUser] = await db
        .update(user)
        .set({ image: uploaded.publicUrl, image_path: uploaded.path })
        .where(eq(user.id, currentUser.id))
        .returning({ image: user.image, image_path: user.image_path });

      if (existing?.image_path && existing.image_path !== uploaded.path) {
        await deleteFiles([existing.image_path]);
      }

      return created<AvatarUploadData>(
        "Avatar uploaded successfully",
        updatedUser,
      );
    }

    // mirror the review-creation eligibility rule so users can't fill
    // storage with images for products they never purchased
    const validOrder = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, currentUser.id),
          eq(orderItems.productId, productId!),
          inArray(orders.orderStatus, ["delivered", "returned"]),
        ),
      )
      .limit(1);

    if (validOrder.length === 0) {
      return forbidden(
        "You can only upload review images for products you have purchased and received",
      );
    }

    const folder = `reviews/${currentUser.id}/${productId}`;
    const uploaded = await uploadFiles(files, folder);

    return ok<UploadedMedia[]>(
      "Files uploaded successfully",
      uploaded.map(({ publicUrl, path, type }) => ({
        url: publicUrl,
        path,
        type,
      })),
    );
  } catch (error) {
    return internalServerError(
      "An error occurred while uploading media",
      error,
    );
  }
}
