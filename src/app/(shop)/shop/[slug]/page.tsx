import ProductPurchase from "@/components/shop/product/ProductPurchase";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import z4 from "zod/v4";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!z4.string().safeParse(slug).success) {
    notFound();
  }

  const product = await db.query.products.findFirst({
    where: (products, { eq }) => eq(products.slug, slug),
    with: {
      productMedia: {
        where: (media, { eq }) => eq(media.isHero, true),
        orderBy: (media, { asc }) => asc(media.sortOrder),
      },
      categories: {
        with: {
          category: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const discountPercentage = product.discountedPrice
    ? Math.round(
        ((Number(product.price) - Number(product.discountedPrice)) /
          Number(product.price)) *
          100,
      ).toString()
    : "0";

  return (
    <div className="px-6 py-3">
      <div className="flex flex-col gap-6">
        {" "}
        <div className="border-ink-25 flex flex-col gap-3 border-b pb-6">
          <p className="font-label text-rose-gold text-lg tracking-widest">
            {product.categories.map((cat) => cat.category.title).join(", ")}
          </p>
          <h1 className="font-display text-2xl font-bold md:text-4xl">
            {product.title}
          </h1>
          <div className="flex items-end gap-4">
            <div className="font-display text-lg font-bold md:text-4xl">
              &#8377;{product.discountedPrice ?? product.price}
            </div>
            {product.discountedPrice && (
              <div className="flex items-end gap-2">
                <div className="font-display text-md text-ink-40 font-semibold line-through">
                  &#8377;{product.price}
                </div>
                <div className="font-display text-rose-gold text-lg font-semibold">
                  {discountPercentage}% OFF
                </div>
              </div>
            )}
          </div>
          <p className="font-serif-alt text-ink md:text-xl">
            {product.description}
          </p>
        </div>
        <ProductPurchase
          sizes={product.sizes}
          price={Number(product.discountedPrice ?? product.price)}
        />
      </div>
    </div>
  );
}
