import { and, count, countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import { categories, productCategories, products } from "../db/schema";
import { db } from "../db";
import type { SQL } from "drizzle-orm";

export type ProductsWithMediaAndCategories = Awaited<
  ReturnType<
    typeof db.query.products.findMany<{
      with: {
        productMedia: true;
        categories: {
          with: {
            category: {
              columns: { title: true; sizeChartImageUrl: true };
            };
          };
        };
      };
    }>
  >
>;

export default async function getProducts({
  slug,
  fabric,
  silhouette,
  sleeveType,
  work,
  category,
  isNewArrival,
  isHeroProduct,
  search,
  page = 1,
  limit = 10,
  isAdmin,
}: {
  slug?: string | null;
  fabric?: string | null;
  silhouette?: string | null;
  sleeveType?: string | null;
  work?: string | null;
  category?: string | null;
  isNewArrival?: string | null;
  isHeroProduct?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
  isAdmin?: boolean;
}) {
  const conditions: SQL[] = [];
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
    conditions.push(sql`${vec} @@ to_tsquery('english', ${tsqueryString})`);
  }

  if (!isAdmin) {
    conditions.push(eq(products.isActive, true));
  }

  let countResult: { count: number }[];
  let allProducts: ProductsWithMediaAndCategories;

  if (tsqueryString) {
    // COUNT
    countResult = await db
      .select({ count: countDistinct(products.id) })
      .from(products)
      .leftJoin(productCategories, eq(products.id, productCategories.productId))
      .leftJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(conditions.length ? and(...conditions) : undefined);

    // RANKED IDs
    const rankedIds = await db
      .select({
        id: products.id,
        match_count: sql<number>`(${sql.join(
          searchTerms.map(
            (term) =>
              sql`(${vec} @@ to_tsquery('english', ${term + ":*"}))::int`,
          ),
          sql` + `,
        )})`.as("match_count"),
        rank: sql<number>`ts_rank('{0.05, 0.2, 0.6, 1.0}'::float4[], ${vec}, to_tsquery('english', ${tsqueryString}))`.as(
          "rank",
        ),
      })
      .from(products)
      .leftJoin(productCategories, eq(products.id, productCategories.productId))
      .leftJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(products.id)
      .orderBy(
        desc(sql`match_count`),
        desc(sql`rank`),
        desc(products.createdAt),
      )
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
                columns: { title: true, sizeChartImageUrl: true },
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
                  title: true,
                  sizeChartImageUrl: true,
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
                title: true,
                sizeChartImageUrl: true,
              },
            },
          },
        },
      },
      limit: limit,
      offset,
    });
  }

  return {
    message: "All products fetched successfully",
    allProducts,
    count: countResult[0].count,
    page: page,
    limit: limit,
  };
}
