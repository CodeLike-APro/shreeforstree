import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { productMedia } from "@/lib/db/schema";
import { categories } from "@/lib/db/schema/category.schema";
import {
  deleteFiles,
  detectMediaType,
  uploadFiles,
  uploadSingleFile,
} from "@/lib/media/media-handle";
import { adminMediaUploadSchema } from "@/lib/validators/media.validators";
import { and, count, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

const MAX_FILES: Record<
  "product-gallery" | "product-hero" | "category",
  number
> = {
  "product-gallery": 10,
  "product-hero": 1,
  category: 1,
};

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await adminCheck(request);
    if (!isAdmin) {
      return forbidden("You are not authorized to upload media");
    }

    const formData = await request.formData();
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: formData.get("type"),
      productId: formData.get("productId") ?? undefined,
      categorySlug: formData.get("categorySlug") ?? undefined,
    });

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { type, productId, categorySlug } = result.data;

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

    if (type === "category") {
      const mediaTypes = await Promise.all(
        files.map((f) => detectMediaType(f)),
      );
      if (mediaTypes.some((m) => !m.isImage)) {
        return badRequest("Only image files are allowed for category uploads");
      }

      const existing = await db.query.categories.findFirst({
        where: (category, { eq }) => eq(category.slug, categorySlug!),
        columns: { id: true, categoryImagePath: true },
      });

      if (!existing) {
        return notFound("Category not found");
      }

      if (existing.categoryImagePath) {
        try {
          await deleteFiles([existing.categoryImagePath]);
        } catch (error) {
          console.error(`Failed to delete old category image: ${error}`);
        }
      }

      const folder = `categories/${existing.id}/category-image`;

      const uploaded = await uploadSingleFile(files[0], folder);

      const [updatedCategory] = await db
        .update(categories)
        .set({
          categoryImageUrl: uploaded.publicUrl,
          categoryImagePath: uploaded.path,
        })
        .where(eq(categories.id, existing.id))
        .returning({
          categoryImageUrl: categories.categoryImageUrl,
          categoryImagePath: categories.categoryImagePath,
        });

      return ok("Category image uploaded successfully", updatedCategory);
    }

    // product-hero and product-gallery both target a product folder and (for
    // hero) a productMedia row — verify the product exists before touching
    // storage so a bad productId can't create orphan files
    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId!),
      columns: { id: true },
    });

    if (!product) {
      return notFound("Product not found");
    }

    if (type === "product-hero") {
      const mediaTypes = await Promise.all(
        files.map((f) => detectMediaType(f)),
      );
      if (mediaTypes.some((m) => !m.isImage)) {
        return badRequest(
          "Only image files are allowed for hero image uploads",
        );
      }

      const existing = await db.query.productMedia.findFirst({
        where: (pm, { and, eq }) =>
          and(eq(pm.productId, productId!), eq(pm.isHero, true)),
        columns: { path: true, id: true },
      });

      const folder = `products/${productId!}/hero-image`;
      const uploaded = await uploadSingleFile(files[0], folder);

      const [updatedHeroImage] = existing
        ? await db
            .update(productMedia)
            .set({ url: uploaded.publicUrl, path: uploaded.path })
            .where(eq(productMedia.id, existing.id))
            .returning({
              path: productMedia.path,
              url: productMedia.url,
              type: productMedia.type,
            })
        : await db
            .insert(productMedia)
            .values({
              productId: productId!,
              url: uploaded.publicUrl,
              path: uploaded.path,
              type: "image",
              isHero: true,
              sortOrder: 0,
            })
            .returning({
              path: productMedia.path,
              url: productMedia.url,
              type: productMedia.type,
            });

      // delete the replaced file only after the new upload and DB update
      // succeeded, so a failed upload can't orphan the DB reference
      if (existing?.path && existing.path !== uploaded.path) {
        await deleteFiles([existing.path]);
      }

      return ok("Hero image uploaded successfully", updatedHeroImage);
    }

    const [{ count: existingMediaCount }] = await db
      .select({
        count: count(),
      })
      .from(productMedia)
      .where(
        and(
          eq(productMedia.productId, productId!),
          eq(productMedia.isHero, false),
        ),
      );

    const totalMediaCount = existingMediaCount + files.length;
    if (totalMediaCount > MAX_FILES["product-gallery"]) {
      return badRequest(
        `You can upload at most ${MAX_FILES["product-gallery"]} files for product gallery`,
      );
    }

    const folder = `products/${productId}`;
    const uploaded = await uploadFiles(files, folder);
    return ok(
      "Files uploaded successfully",
      uploaded.map(({ publicUrl, path, type: mediaType }) => ({
        url: publicUrl,
        path,
        type: mediaType,
      })),
    );
  } catch (error) {
    return internalServerError(
      "An error occurred while uploading media",
      error,
    );
  }
}
