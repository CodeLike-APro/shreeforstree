import slugify from "slugify";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  internalServerError,
  paginated,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { productCategories, productMedia } from "@/lib/db/schema";
import { products } from "@/lib/db/schema/products.schema";
import { deleteFiles, uploadFiles } from "@/lib/media/media-handle";
import getProducts from "@/lib/queries/products";
import { createProductSchema } from "@/lib/validators/product.validators";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const fabric = searchParams.get("fabric");
    const silhouette = searchParams.get("silhouette");
    const sleeveType = searchParams.get("sleeveType");
    const work = searchParams.get("work");
    const category = searchParams.get("categories");
    const isNewArrival = searchParams.get("isNewArrival");
    const isHeroProduct = searchParams.get("isHeroProduct");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(
      1,
      parseInt(searchParams.get("limit") ?? "10") || 10,
    );

    const isAdmin = await adminCheck(request);

    const products = await getProducts({
      slug,
      fabric,
      silhouette,
      sleeveType,
      work,
      category,
      isNewArrival,
      isHeroProduct,
      search,
      isAdmin,
      page,
      limit,
    });

    return paginated(
      "All products fetched successfully",
      products.allProducts,
      products.count,
      products.page,
      products.limit,
    );
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
    const isActiveBool =
      formData.get("isActive") !== null
        ? formData.get("isActive") === "true"
        : undefined;
    const isNewArrivalRaw = formData.get("isNewArrival");
    const isHeroProductRaw = formData.get("isHeroProduct");
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      price: formData.get("price"),
      discountedPrice: formData.get("discountedPrice"),
      sizes: formData.getAll("sizes"),
      colors: formData.getAll("colors"),
      isActive: isActiveBool,
      isNewArrival:
        isNewArrivalRaw !== null ? isNewArrivalRaw === "true" : undefined,
      isHeroProduct:
        isHeroProductRaw !== null ? isHeroProductRaw === "true" : undefined,
      fabric: formData.get("fabric"),
      work: formData.getAll("work"),
      silhouette: formData.get("silhouette"),
      lining: formData.get("lining"),
      sleeveType: formData.get("sleeveType"),
      neckline: formData.get("neckline"),
      length: formData.get("length"),
      careInstructions: formData.get("careInstructions"),
      categoryIds: formData.getAll("categoryIds"),
      keywords: formData.getAll("keywords"),
    };
    const files = formData.getAll("files") as File[];

    const sortOrders = formData.getAll("sortOrders").map((order) => {
      const parsed = parseInt(order as string, 10);
      // NaN survives `?? index` fallback below — normalize to undefined
      return Number.isNaN(parsed) ? undefined : parsed;
    });

    if (files.length === 0) {
      return badRequest("At least one media file is required");
    }

    const hasImage = files.some((file) => file.type.startsWith("image/"));

    if (!hasImage) {
      return badRequest("At least one image is required");
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
      fabric,
      work,
      silhouette,
      lining,
      sleeveType,
      neckline,
      length,
      careInstructions,
      categoryIds,
      keywords,
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

    const newProductId = crypto.randomUUID();
    const uploadedFIlesData = await uploadFiles(
      files,
      `products/${newProductId}`,
    );

    if (!uploadedFIlesData || uploadedFIlesData.length === 0) {
      return internalServerError("Failed to upload media files");
    }

    try {
      const [newProduct] = await db.transaction(async (tx) => {
        const [product] = await tx
          .insert(products)
          .values({
            id: newProductId,
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
            fabric: fabric.trim(),
            work: work?.map((w) => w.trim()),
            silhouette: silhouette?.trim(),
            lining: lining?.trim(),
            sleeveType: sleeveType?.trim(),
            neckline: neckline?.trim(),
            length: length?.trim(),
            careInstructions: careInstructions?.trim(),
            keywords: keywords?.map((k) => k.trim()),
          })
          .returning();

        await tx
          .insert(productMedia)
          .values(
            uploadedFIlesData.map((file, index) => ({
              productId: product.id,
              type: file.type,
              url: file.publicUrl,
              path: file.path,
              sortOrder: sortOrders[index] ?? index,
              isHero: false,
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
      await deleteFiles(uploadedFIlesData.map((file) => file.path));
      return internalServerError("Error creating product", error);
    }
  } catch (error) {
    return internalServerError(
      "Error creating product",
      error instanceof Error ? error.message : error,
    );
  }
}
