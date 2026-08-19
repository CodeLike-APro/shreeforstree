import { notFound } from "next/navigation";
import z4 from "zod/v4";
import { db } from "@/lib/db";
import { orderItems } from "@/lib/db/schema";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!z4.uuid().safeParse(id).success) {
    notFound();
  }

  const product = await db.query.products.findFirst({
    where: (products, { eq }) => eq(products.id, id),
    with: {
      productMedia: { orderBy: (media, { asc }) => asc(media.sortOrder) },
      categories: { with: { category: true } },
    },
  });

  if (!product) {
    notFound();
  }

  const orderRef = await db.query.orderItems.findFirst({
    where: (oi, { eq }) => eq(oi.productId, id),
    columns: { id: true },
  });

  const gallery = product.productMedia
    .filter((m) => !m.isHero && !m.isFabricSwatch)
    .map((m) => ({
      url: m.url,
      path: m.path,
      type: m.type,
      sortOrder: m.sortOrder,
    }));

  const heroUrl = product.productMedia.find((m) => m.isHero)?.url ?? null;

  return (
    <ProductForm
      mode="edit"
      hasOrders={Boolean(orderRef)}
      initial={{
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice,
        sizes: product.sizes,
        colors: product.colors,
        isActive: product.isActive,
        isNewArrival: product.isNewArrival,
        isHeroProduct: product.isHeroProduct,
        fabric: product.fabric,
        work: product.work ?? [],
        silhouette: product.silhouette,
        lining: product.lining,
        sleeveType: product.sleeveType,
        neckline: product.neckline,
        length: product.length,
        careInstructions: product.careInstructions,
        keywords: product.keywords ?? [],
        categoryIds: product.categories.map((pc) => pc.categoryId),
        gallery,
        heroUrl,
      }}
    />
  );
}
