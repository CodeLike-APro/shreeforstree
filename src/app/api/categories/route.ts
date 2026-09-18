export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import slugify from "slugify";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  internalServerError,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema/category.schema";
import { deleteFile, uploadSingleFile } from "@/lib/media/media-handle";
import { createCategorySchema } from "@/lib/validators/category.validators";

import type { Category } from "@/types/models";

export async function GET(request: Request) {
  try {
    const isAdmin = await adminCheck(request);
    const allCategories = isAdmin
      ? await db.select().from(categories)
      : await db.select().from(categories).where(eq(categories.isActive, true));
    return ok<Category[]>(
      "All categories fetched successfully",
      allCategories,
      {
        "Cache-Control": isAdmin
          ? "no-store"
          : "private, max-age=300, stale-while-revalidate=600",
      },
    );
  } catch (error) {
    return internalServerError("Failed to fetch categories", error);
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await adminCheck(request);
    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const formData = await request.formData();
    const isActiveRaw = formData.get("isActive");

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      isActive: isActiveRaw !== null ? isActiveRaw === "true" : undefined,
    };

    const file = formData.get("files") as File | null;

    const result = await createCategorySchema.safeParseAsync(data);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { title, description = "" } = result.data;

    const slug = slugify(title.trim(), { lower: true, strict: true });

    const existingCategory = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, slug),
    });

    if (existingCategory) {
      return conflict(
        "A category with the same name already exists. Please choose a different name.",
      );
    }

    const newCategoryId = crypto.randomUUID();
    const uploaded = file
      ? await uploadSingleFile(
          file,
          `categories/${newCategoryId}/category-image`,
        )
      : null;

    if (file && !uploaded) {
      return internalServerError("Failed to upload category image");
    }
    try {
      const [newCategory] = await db
        .insert(categories)
        .values({
          id: newCategoryId,
          title: title.trim(),
          slug: slug,
          description: description.trim(),
          categoryImageUrl: uploaded?.publicUrl || null,
          categoryImagePath: uploaded?.path || null,
        })
        .returning();
      return created<Category>("Category created successfully", newCategory);
    } catch (error) {
      if (uploaded && uploaded.path) {
        await deleteFile(uploaded.path);
      }
      return internalServerError("Error creating category", error);
    }
  } catch (error) {
    return internalServerError(
      "Error creating category",
      error instanceof Error ? error.message : error,
    );
  }
}
