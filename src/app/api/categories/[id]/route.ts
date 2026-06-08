import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { productCategories } from "@/lib/db/schema";
import { categories } from "@/lib/db/schema/category.schema";
import { updateCategorySchema } from "@/lib/validators/category.validators";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import slugify from "slugify";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { id: categoryId } = await params;
    const body = await request.json();
    const result = await updateCategorySchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { name, description, categoryImageUrl, isActive } = result.data;

    const slug = name
      ? slugify(name.trim(), { lower: true, strict: true })
      : undefined;

    const category = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.id, categoryId),
    });

    if (!category) {
      return notFound("Category not found");
    }

    const updatedCategory = await db
      .update(categories)
      .set({
        ...(name && { name: name.trim(), slug }),
        ...(description && { description: description.trim() }),
        ...(categoryImageUrl && {
          categoryImageUrl: categoryImageUrl.trim(),
        }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();
    return ok("Category updated successfully", updatedCategory);
  } catch (error) {
    return internalServerError("Error updating category", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { id: categoryId } = await params;

    const category = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.id, categoryId),
    });

    if (!category) {
      return notFound("Category not found");
    }

    const linkedProducts = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId))
      .limit(1);

    if (linkedProducts.length > 0) {
      return badRequest("Cannot delete category with linked products");
    }

    await db.delete(categories).where(eq(categories.id, categoryId));
    return ok("Category deleted successfully", category);
  } catch (error) {
    return internalServerError("Error deleting category", error);
  }
}
