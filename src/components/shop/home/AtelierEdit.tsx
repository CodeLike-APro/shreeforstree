import Card from "@/utils/Card";

import type { HomeData } from "@/lib/queries/home";

export default function AtelierEdit({
  products,
}: {
  products: HomeData["atelierEdit"];
}) {
  return (
    <section className="mx-auto max-w-full px-4 py-16 md:px-8 md:py-20">
      <div className="text-center">
        <p className="label-caps text-rose-gold text-xs">
          Made once, made yours
        </p>
        <h2 className="font-display text-ink mt-3 text-4xl leading-tight font-bold md:text-5xl">
          The Atelier Edit
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-10">
        {products.map((product) => (
          <Card
            key={product.id}
            variant="customer-product"
            data={product}
            href={`/shop/${product.slug}`}
            className="w-full"
            sizes="(min-width: 768px) 25vw, 50vw"
          />
        ))}
      </div>
    </section>
  );
}
