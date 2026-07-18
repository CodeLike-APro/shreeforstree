import {
  badRequest,
  created,
  internalServerError,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import {
  deleteFiles,
  detectMediaType,
  uploadFiles,
  uploadSingleFile,
} from "@/lib/media/media-handle";
import { mediaUploadSchema } from "@/lib/validators/media.validators";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

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

      if (existing?.image_path) {
        try {
          await deleteFiles([existing.image_path]);
        } catch (error) {
          console.error(`Failed to delete old avatar: ${error}`);
        }
      }
      const uploaded = await uploadSingleFile(files[0], folder);

      const [updatedUser] = await db
        .update(user)
        .set({ image: uploaded.publicUrl, image_path: uploaded.path })
        .where(eq(user.id, currentUser.id))
        .returning({ image: user.image, image_path: user.image_path });

      return created("Avatar uploaded successfully", updatedUser);
    }

    const folder = `reviews/${currentUser.id}/${productId}`;
    const uploaded = await uploadFiles(files, folder);

    return ok(
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
