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
import { productCategories } from "@/lib/db/schema";
import { categories } from "@/lib/db/schema/category.schema";
import { products } from "@/lib/db/schema/products.schema";
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

    const body = await request.json();

    const result = await createProductSchema.safeParseAsync(body);

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
      imagesUrl,
      sizes,
      colors,
      isActive,
      isNewArrival,
      isHeroProduct,
      categoryIds,
    } = result.data;

    let { heroImageUrl } = result.data;

    const slug = slugify(title.trim(), { lower: true, strict: true });
    if (!isHeroProduct && heroImageUrl) {
      heroImageUrl = undefined;
    }

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
          imagesUrl,
          sizes,
          colors,
          isActive,
          isNewArrival,
          isHeroProduct,
          heroImageUrl: heroImageUrl?.trim() || null,
          slug,
        })
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
    return internalServerError("Error creating product", error);
  }
}
