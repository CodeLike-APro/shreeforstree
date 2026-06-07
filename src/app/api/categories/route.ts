import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema/category.schema";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  internalServerError,
  ok,
} from "@/lib/api-response";
import { eq } from "drizzle-orm";
import { adminCheck } from "@/lib/auth-utils";
import slugify from "slugify";
import { createCategorySchema } from "@/lib/validators/category.validators";

export async function GET(request: Request) {
  try {
    const isAdmin = await adminCheck(request);
    const allCategories = isAdmin
      ? await db.select().from(categories)
      : await db.select().from(categories).where(eq(categories.isActive, true));
    return ok("All categories fetched successfully", allCategories);
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

    const body = await request.json();
    const result = await createCategorySchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { name, description = "", categoryImageUrl = "" } = result.data;

    const slug = slugify(name.trim(), { lower: true, strict: true });

    const existingCategory = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, slug),
    });

    if (existingCategory) {
      return conflict(
        "A category with the same name already exists. Please choose a different name.",
      );
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        slug: slug,
        description: description.trim(),
        categoryImageUrl: categoryImageUrl.trim(),
      })
      .returning();
    return created("Category created successfully", newCategory);
  } catch (error) {
    return internalServerError("Error creating category", error);
  }
}
