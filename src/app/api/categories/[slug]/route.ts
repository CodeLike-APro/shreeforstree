import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { productCategories } from "@/lib/db/schema";
import { categories } from "@/lib/db/schema/category.schema";
import { deleteFile } from "@/lib/media/media-handle";
import { updateCategorySchema } from "@/lib/validators/category.validators";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import slugify from "slugify";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { slug: categorySlug } = await params;
    const body = await request.json();

    const result = await updateCategorySchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const {
      name,
      description,
      isActive,
      categoryImageUrl,
      categoryImagePath,
      sizeChartImageUrl,
      sizeChartImagePath,
    } = result.data;

    const slug = name
      ? slugify(name.trim(), { lower: true, strict: true })
      : undefined;

    const category = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, categorySlug),
    });

    if (!category) {
      return notFound("Category not found");
    }

    if (slug) {
      const existingCategory = await db.query.categories.findFirst({
        where: (categories, { and, eq, ne }) =>
          and(eq(categories.slug, slug), ne(categories.id, category.id)),
      });

      if (existingCategory) {
        return conflict("A category with the same title already exists.");
      }
    }

    const updatedCategory = await db
      .update(categories)
      .set({
        ...(name && { name: name.trim(), slug }),
        ...(description && { description: description.trim() }),
        ...(categoryImageUrl ? { categoryImageUrl, categoryImagePath } : {}),
        ...(sizeChartImageUrl ? { sizeChartImageUrl, sizeChartImagePath } : {}),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(categories.slug, categorySlug))
      .returning();
    return ok("Category updated successfully", updatedCategory);
  } catch (error) {
    return internalServerError("Error updating category", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { slug: categorySlug } = await params;

    const category = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, categorySlug),
    });

    if (!category) {
      return notFound("Category not found");
    }

    const linkedProducts = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.categoryId, category.id))
      .limit(1);

    if (linkedProducts.length > 0) {
      return badRequest("Cannot delete category with linked products");
    }
    if (category.categoryImagePath || category.sizeChartImagePath) {
      try {
        if (category.categoryImagePath) {
          await deleteFile(category.categoryImagePath);
        }
        if (category.sizeChartImagePath) {
          await deleteFile(category.sizeChartImagePath);
        }
      } catch (error) {
        console.error("Failed to delete category image", error);
      }
    }
    await db.delete(categories).where(eq(categories.slug, categorySlug));

    return ok("Category deleted successfully", category);
  } catch (error) {
    return internalServerError("Error deleting category", error);
  }
}
