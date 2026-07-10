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
import { productCategories, productMedia } from "@/lib/db/schema";
import { categories } from "@/lib/db/schema/category.schema";
import { products } from "@/lib/db/schema/products.schema";
import { uploadFiles } from "@/lib/media/media-handle";
import { createProductSchema } from "@/lib/validators/product.validators";
import { and, eq, SQL } from "drizzle-orm";
import { NextRequest } from "next/server";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conditions: SQL[] = [];
    const category = searchParams.get("categories");
    const isNewArrival = searchParams.get("isNewArrival");
    const isHeroProduct = searchParams.get("isHeroProduct");

    if (category) {
      conditions.push(eq(categories.slug, category));
    }
    if (isNewArrival === "true") {
      conditions.push(eq(products.isNewArrival, true));
    }
    if (isHeroProduct === "true") {
      conditions.push(eq(products.isHeroProduct, true));
    }

    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      conditions.push(eq(products.isActive, true));
    }

    const allProducts = category
      ? await db
          .select()
          .from(products)
          .leftJoin(
            productCategories,
            eq(products.id, productCategories.productId),
          )
          .leftJoin(categories, eq(categories.id, productCategories.categoryId))
          .where(conditions.length ? and(...conditions) : undefined)
      : await db
          .select()
          .from(products)
          .where(conditions.length ? and(...conditions) : undefined);

    return ok("All products fetched successfully", allProducts);
  } catch (error) {
    return internalServerError("Failed to fetch products", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await adminCheck(request);
    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const formData = await request.formData();
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      price: formData.get("price"),
      discountedPrice: formData.get("discountedPrice"),
      sizes: formData.getAll("sizes"),
      colors: formData.getAll("colors"),
      isActive: formData.get("isActive") === "true",
      isNewArrival: formData.get("isNewArrival") === "true",
      isHeroProduct: formData.get("isHeroProduct") === "true",
      categoryIds: formData.getAll("categoryIds"),
    };
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      throw badRequest("At least one media file is required");
    }

    const hasImage = files.some((file) => file.type.startsWith("image/"));

    if (!hasImage) {
      throw badRequest("At least one image is required");
    }

    const result = await createProductSchema.safeParseAsync(data);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const {
      title,
      description,
      price,
      discountedPrice,
      sizes,
      colors,
      isActive,
      isNewArrival,
      isHeroProduct,
      categoryIds,
    } = result.data;

    const slug = slugify(title.trim(), { lower: true, strict: true });

    const existingProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.slug, slug),
    });

    if (existingProduct) {
      return conflict(
        "A product with the same title already exists. Please choose a different title.",
      );
    }

    const [newProduct] = await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          title: title.trim(),
          description: description.trim(),
          price,
          discountedPrice,
          sizes,
          colors,
          isActive,
          isNewArrival,
          isHeroProduct,
          slug,
        })
        .returning();

      const uploadedFIlesData = await uploadFiles(
        files,
        `products/${product.id}`,
      );

      if (!uploadedFIlesData || uploadedFIlesData.length === 0) {
        throw internalServerError("Failed to upload media files");
      }

      //TODO: Add sort order of files

      await tx
        .insert(productMedia)
        .values(
          uploadedFIlesData.map((file, index) => ({
            productId: product.id,
            type: file.type,
            url: file.publicUrl,
            path: file.path,
            sortOrder: index,
            isHero: index === 0 && isHeroProduct ? true : false,
          })),
        )
        .returning();

      if (categoryIds.length) {
        await tx.insert(productCategories).values(
          categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
        );
      }
      return [product];
    });
    return created("Product created successfully", newProduct);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return internalServerError(
      "Error creating product",
      error instanceof Error ? error.message : error,
    );
  }
}
