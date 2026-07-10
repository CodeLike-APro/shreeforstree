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
import { uploadFiles } from "@/lib/media/media-handle";

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

    const formData = await request.formData();

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      isActive: formData.get("isActive") === "true",
    };

    const files = formData.get("files") as File[] | null;

    const result = await createCategorySchema.safeParseAsync(data);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const { name, description = "" } = result.data;

    const slug = slugify(name.trim(), { lower: true, strict: true });

    const existingCategory = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, slug),
    });

    if (existingCategory) {
      return conflict(
        "A category with the same name already exists. Please choose a different name.",
      );
    }

    const uploadedFileData = files
      ? await uploadFiles(files, `categories/${slug}`)
      : null;

    let categoryImageUrl;
    let categoryImagePath;

    if (uploadedFileData && uploadedFileData.length > 0) {
      uploadedFileData.map((file) => ({
        categoryImageUrl: file.publicUrl,
        categoryImagePath: file.path,
      }));
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        slug: slug,
        description: description.trim(),
        categoryImageUrl: categoryImageUrl,
        categoryImagePath: categoryImagePath,
      })
      .returning();
    return created("Category created successfully", newCategory);
  } catch (error) {
    return internalServerError(
      "Error creating category",
      error instanceof Error ? error.message : error,
    );
  }
}
