import { notFound } from "next/navigation";
import ProductDescription from "@/components/shop/product/ProductDescription";
import ProductDetails from "@/components/shop/product/ProductDetails";
import ProductGallery from "@/components/shop/product/ProductGallery";
import ProductPurchase from "@/components/shop/product/ProductPurchase";
import { db } from "@/lib/db";

import type { ProductDetail } from "@/types/api/products";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product: ProductDetail | undefined = await db.query.products.findFirst({
    where: (products, { eq }) => eq(products.slug, slug),
    with: {
      productMedia: {
        where: (media, { eq }) => eq(media.isHero, false),
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

  const productGallery = product.productMedia
    .filter((m) => !m.isFabricSwatch)
    .filter((m) => m.type !== "video");

  const productDetails = {
    fabric: product.fabric,
    work: product.work,
    silhouette: product.silhouette,
    lining: product.lining,
    sleeveType: product.sleeveType,
    neckline: product.neckline,
    length: product.length,
    careInstructions: product.careInstructions,
  };

  return (
    <div className="px-8 pt-16 pb-3">
      <div className="border-ink-25 flex items-start justify-around gap-2 border-b pb-25">
        <div className="sticky top-24 w-[45%]">
          <ProductGallery
            productMedia={productGallery}
            productTitle={product.title}
          />
        </div>
        <div className="sticky top-24 flex w-[50%] flex-col gap-6">
          {" "}
          <div className="border-ink-25 flex flex-col gap-3 border-b pb-7">
            <p className="font-label text-rose-gold text-lg tracking-widest uppercase">
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
                  <div className="font-display text-ink-40 text-base font-semibold line-through">
                    &#8377;{product.price}
                  </div>
                  <div className="font-display text-rose-gold text-lg font-semibold">
                    {discountPercentage}% OFF
                  </div>
                </div>
              )}
            </div>
            <ProductDescription description={product.description} />
          </div>
          <ProductPurchase
            sizes={product.sizes}
            price={Number(product.discountedPrice ?? product.price)}
            sizeGuide={product.categories[0]?.category.sizeChartImageUrl}
            productId={product.id}
          />
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="bg-ink-25 h-px w-full"></div>
            <p className="font-serif-alt text-ink shrink-0 text-sm tracking-widest uppercase">
              Made once, made yours.
            </p>
            <div className="bg-ink-25 h-px w-full"></div>
          </div>
        </div>
      </div>
      <div>
        <ProductDetails details={productDetails} />
      </div>
    </div>
  );
}
