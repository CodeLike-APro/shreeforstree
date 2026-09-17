import { and, count, eq } from "drizzle-orm";
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

import type { NextRequest } from "next/server";

const MAX_FILES: Record<
  | "product-gallery"
  | "product-hero"
  | "product-fabric"
  | "category"
  | "category-size-chart",
  number
> = {
  "product-gallery": 10,
  "product-hero": 1,
  "product-fabric": 4,
  category: 1,
  "category-size-chart": 1,
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
      keepCount: formData.get("keepCount") ?? undefined,
    });

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { type, productId, categorySlug, keepCount } = result.data;

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

    if (type === "category-size-chart") {
      const mediaTypes = await Promise.all(
        files.map((f) => detectMediaType(f)),
      );
      if (mediaTypes.some((m) => !m.isImage)) {
        return badRequest(
          "Only image files are allowed for category size chart uploads",
        );
      }

      const existing = await db.query.categories.findFirst({
        where: (category, { eq }) => eq(category.slug, categorySlug!),
        columns: { id: true, sizeChartImagePath: true },
      });

      if (!existing) {
        return notFound("Category not found");
      }

      if (existing.sizeChartImagePath) {
        try {
          await deleteFiles([existing.sizeChartImagePath]);
        } catch (error) {
          console.error(`Failed to delete old size chart image: ${error}`);
        }
      }

      const folder = `categories/${existing.id}/size-chart-image`;

      const uploaded = await uploadSingleFile(files[0], folder);

      const [updatedCategory] = await db
        .update(categories)
        .set({
          sizeChartImageUrl: uploaded.publicUrl,
          sizeChartImagePath: uploaded.path,
        })
        .where(eq(categories.id, existing.id))
        .returning({
          sizeChartImageUrl: categories.sizeChartImageUrl,
          sizeChartImagePath: categories.sizeChartImagePath,
        });

      return ok("Category size chart uploaded successfully", updatedCategory);
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

    if (type === "product-fabric") {
      const mediaTypes = await Promise.all(
        files.map((f) => detectMediaType(f)),
      );
      if (mediaTypes.some((m) => !m.isImage)) {
        return badRequest(
          "Only image files are allowed for fabric swatch uploads",
        );
      }

      const [{ count: existingFabricCount }] = await db
        .select({ count: count() })
        .from(productMedia)
        .where(
          and(
            eq(productMedia.productId, productId!),
            eq(productMedia.isFabricSwatch, true),
          ),
        );

      // keepCount lets the caller declare how many existing fabric swatches
      // it intends to keep (the rest will be dropped in the follow-up PATCH),
      // so a replace flow isn't blocked by the current DB count. Falls back
      // to the conservative "nothing removed" assumption if omitted.
      const effectiveExistingFabricCount =
        keepCount !== undefined
          ? Math.min(keepCount, existingFabricCount)
          : existingFabricCount;

      const totalFabricCount = effectiveExistingFabricCount + files.length;
      if (totalFabricCount > MAX_FILES["product-fabric"]) {
        return badRequest(
          `You can upload at most ${MAX_FILES["product-fabric"]} files for product fabric`,
        );
      }

      const folder = `products/${productId}/fabric`;
      const uploaded = await uploadFiles(files, folder);

      return ok(
        "Fabric swatch files uploaded successfully",
        uploaded.map(({ publicUrl, path, type: mediaType }) => ({
          url: publicUrl,
          path,
          type: mediaType,
        })),
      );
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
          eq(productMedia.isFabricSwatch, false),
        ),
      );

    // keepCount lets the caller declare how many existing gallery images it
    // intends to keep (the rest will be dropped in the follow-up PATCH), so
    // a replace flow isn't blocked by the current DB count. Falls back to
    // the conservative "nothing removed" assumption if omitted.
    const effectiveExistingMediaCount =
      keepCount !== undefined
        ? Math.min(keepCount, existingMediaCount)
        : existingMediaCount;

    const totalMediaCount = effectiveExistingMediaCount + files.length;
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
