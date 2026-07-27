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
import { categories } from "@/lib/db/schema/category.schema";
import { products } from "@/lib/db/schema/products.schema";
import { deleteFiles, uploadFiles } from "@/lib/media/media-handle";
import { createProductSchema } from "@/lib/validators/product.validators";
import { and, count, eq, SQL, desc, sql, inArray, countDistinct } from "drizzle-orm";
import { NextRequest } from "next/server";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conditions: SQL[] = [];
    const slug = searchParams.get("slug");
    const fabric = searchParams.get("fabric");
    const silhouette = searchParams.get("silhouette");
    const sleeveType = searchParams.get("sleeveType");
    const work = searchParams.get("work");
    const category = searchParams.get("categories");
    const isNewArrival = searchParams.get("isNewArrival");
    const isHeroProduct = searchParams.get("isHeroProduct");
    const search = searchParams.get("search");
    let searchTerms: string[] = [];
    let tsqueryString = "";
    if (search) {
      searchTerms = search
        .split(/\s+/)
        .map((term) => term.replace(/[^\p{L}\p{N}]/gu, ""))
        .filter(Boolean)
        .slice(0, 8);
      if (searchTerms.length > 0) {
        tsqueryString = searchTerms.map((w) => `${w}:*`).join(" | ");
      }
    }
    const vec = sql`product_search_vector(${products.title}, ${products.description}, ${products.keywords})`;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(
      1,
      parseInt(searchParams.get("limit") ?? "10") || 10,
    );
    const offset = (page - 1) * limit;

    if (fabric) {
      const fabrics = fabric.split(",");
      conditions.push(inArray(products.fabric, fabrics));
    }
    if (silhouette) {
      const silhouettes = silhouette.split(",");
      conditions.push(inArray(products.silhouette, silhouettes));
    }
    if (sleeveType) {
      const sleeveTypes = sleeveType.split(",");
      conditions.push(inArray(products.sleeveType, sleeveTypes));
    }
    if (work) {
      const workItems = work.split(",");
      conditions.push(sql`${products.work} && ${workItems}`);
    }
    if (slug) {
      conditions.push(eq(products.slug, slug));
    }
    if (category) {
      conditions.push(eq(categories.slug, category));
    }
    if (isNewArrival === "true") {
      conditions.push(eq(products.isNewArrival, true));
    }
    if (isHeroProduct === "true") {
      conditions.push(eq(products.isHeroProduct, true));
    }
    if (tsqueryString) {
      conditions.push(
        sql`${vec} @@ to_tsquery('english', ${tsqueryString})`
      );
    }

    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      conditions.push(eq(products.isActive, true));
    }

    let countResult: { count: number }[];
    let allProducts: Awaited<ReturnType<typeof db.query.products.findMany>>;

    if (tsqueryString) {
      // COUNT
      countResult = await db
        .select({ count: countDistinct(products.id) })
        .from(products)
        .leftJoin(
          productCategories,
          eq(products.id, productCategories.productId),
        )
        .leftJoin(categories, eq(categories.id, productCategories.categoryId))
        .where(conditions.length ? and(...conditions) : undefined);

      // RANKED IDs
      const rankedIds = await db
        .select({
          id: products.id,
          match_count: sql<number>`(${sql.join(
            searchTerms.map((term) => sql`(${vec} @@ to_tsquery('english', ${term + ":*"}))::int`),
            sql` + `
          )})`.as("match_count"),
          rank: sql<number>`ts_rank('{0.05, 0.2, 0.6, 1.0}'::float4[], ${vec}, to_tsquery('english', ${tsqueryString}))`.as("rank"),
        })
        .from(products)
        .leftJoin(
          productCategories,
          eq(products.id, productCategories.productId),
        )
        .leftJoin(categories, eq(categories.id, productCategories.categoryId))
        .where(conditions.length ? and(...conditions) : undefined)
        .groupBy(products.id)
        .orderBy(desc(sql`match_count`), desc(sql`rank`), desc(products.createdAt))
        .limit(limit)
        .offset(offset);

      if (rankedIds.length === 0) {
        allProducts = [];
      } else {
        const rankMap = new Map(rankedIds.map((r, i) => [r.id, i]));

        allProducts = await db.query.products.findMany({
          where: (products, { inArray }) =>
            inArray(
              products.id,
              rankedIds.map((r) => r.id),
            ),
          with: {
            productMedia: {
              where: (media, { and, eq }) =>
                and(eq(media.isHero, false), eq(media.isFabricSwatch, false)),
              orderBy: (media, { asc }) => asc(media.sortOrder),
              limit: 3,
            },
            categories: {
              with: {
                category: {
                  columns: { name: true },
                },
              },
            },
          },
        });

        // Re-sort by rank order from ranked query
        allProducts.sort(
          (a, b) => (rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0),
        );
      }
    } else if (category) {
      countResult = await db
        .select({ count: count() })
        .from(products)
        .innerJoin(
          productCategories,
          eq(products.id, productCategories.productId),
        )
        .innerJoin(categories, eq(categories.id, productCategories.categoryId))
        .where(conditions.length ? and(...conditions) : undefined);

      const productIds = await db
        .select({ id: products.id })
        .from(products)
        .innerJoin(
          productCategories,
          eq(products.id, productCategories.productId),
        )
        .innerJoin(categories, eq(categories.id, productCategories.categoryId))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);

      if (productIds.length === 0) {
        allProducts = [];
      } else {
        allProducts = await db.query.products.findMany({
          orderBy: (products, { desc }) => [desc(products.createdAt)],
          where: (products, { inArray }) =>
            inArray(
              products.id,
              productIds.map((p) => p.id),
            ),
          with: {
            productMedia: {
              where: (media, { and, eq }) =>
                and(eq(media.isHero, false), eq(media.isFabricSwatch, false)),
              orderBy: (media, { asc }) => asc(media.sortOrder),
              limit: 3,
            },
            categories: {
              with: {
                category: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        });
      }
    } else {
      countResult = await db
        .select({ count: count() })
        .from(products)
        .where(conditions.length ? and(...conditions) : undefined);
      allProducts = await db.query.products.findMany({
        orderBy: (products, { desc }) => [desc(products.createdAt)],
        where: conditions.length ? and(...conditions) : undefined,
        with: {
          productMedia: {
            where: (media, { and, eq }) =>
              and(eq(media.isHero, false), eq(media.isFabricSwatch, false)),
            orderBy: (media, { asc }) => asc(media.sortOrder),
            limit: 3,
          },
          categories: {
            with: {
              category: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
        limit,
        offset,
      });
    }

    return paginated(
      "All products fetched successfully",
      allProducts,
      countResult[0].count,
      page,
      limit,
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
