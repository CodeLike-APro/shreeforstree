import { sql } from "drizzle-orm";
import { db } from "../db";
import {
  MAX_ATELIER_EDIT_PRODUCTS,
  MAX_CATEGORIES,
  MAX_HERO_PRODUCTS,
  MAX_NEW_ARRIVALS,
} from "../constants";

async function getAtelierEdit(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];

  const { rows } = await db.execute<{
    category_id: string;
    product_id: string;
  }>(sql`
        select category_id, product_id
        from (
         select pc.category_id, pc.product_id,
             row_number() over(
              partition by pc.category_id
              order by p.created_at desc, p.id desc
           ) as candidate_rank
          from product_categories pc
          join products p on p.id = pc.product_id
          where pc.category_id in ${categoryIds} and p.is_active = true
        ) c 
          where candidate_rank <= ${MAX_ATELIER_EDIT_PRODUCTS}
          order by candidate_rank
         `);

  const candidates = new Map<string, string[]>();
  for (const row of rows) {
    candidates.set(row.category_id, [
      ...(candidates.get(row.category_id) ?? []),
      row.product_id,
    ]);
  }

  const chosen: string[] = [];
  for (const categoryId of categoryIds) {
    if (chosen.length === MAX_ATELIER_EDIT_PRODUCTS) break;
    const pick = (candidates.get(categoryId) ?? []).find(
      (id) => !chosen.includes(id),
    );
    if (pick) chosen.push(pick);
  }
  if (chosen.length === 0) return [];

  const picked = await db.query.products.findMany({
    where: (products, { inArray }) => inArray(products.id, chosen),
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

  return picked.sort((a, b) => chosen.indexOf(a.id) - chosen.indexOf(b.id));
}

export async function getHomeData() {
  const [heroProducts, newArrivals, categories] = await Promise.all([
    db.query.products
      .findMany({
        where: (products, { and, eq }) =>
          and(eq(products.isActive, true), eq(products.isHeroProduct, true)),
        with: {
          productMedia: {
            where: (media, { eq }) => eq(media.isHero, true),
            orderBy: (media, { asc }) => asc(media.sortOrder),
            limit: 1,
          },
          categories: {
            columns: {},
            with: {
              category: {
                columns: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: (products, { desc }) => [
          desc(products.updatedAt),
          desc(products.id),
        ],
        limit: MAX_HERO_PRODUCTS,
      })
      .then((hits) =>
        hits.filter((product) => product.productMedia.length > 0),
      ),

    db.query.products.findMany({
      where: (products, { and, eq }) =>
        and(eq(products.isActive, true), eq(products.isNewArrival, true)),
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
      orderBy: (products, { desc }) => [
        desc(products.createdAt),
        desc(products.id),
      ],
      limit: MAX_NEW_ARRIVALS,
    }),

    db.query.categories.findMany({
      where: (categories, { eq }) => eq(categories.isActive, true),
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        categoryImageUrl: true,
      },
      orderBy: (categories, { asc }) => [asc(categories.title)],
      limit: MAX_CATEGORIES,
    }),
  ]);

  const atelierEdit = await getAtelierEdit(categories.map((c) => c.id));

  return {
    heroProducts,
    newArrivals,
    categories,
    atelierEdit,
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
