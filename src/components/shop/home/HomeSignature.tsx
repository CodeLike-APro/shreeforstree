import Image from "next/image";
import Link from "next/link";
import { formatAmount } from "@/lib/orders";

import type { HomeData } from "@/lib/queries/home";

export default function HomeSignature({
  product,
}: {
  product: HomeData["heroProducts"][number];
}) {
  const image = product.productMedia[0];
  const fromPrice =
    product.discountedPrice != null &&
    Number(product.discountedPrice) < Number(product.price)
      ? product.discountedPrice
      : product.price;

  return (
    <section className="px-4">
      <div className="from-paper via-blush/40 to-blush relative flex flex-col-reverse overflow-hidden rounded-2xl bg-linear-to-br py-2 shadow-lg md:grid md:grid-cols-[1.05fr_1fr] md:items-stretch md:rounded-none md:py-0 md:shadow-none">
        {/* copy */}
        <div className="relative flex max-w-xl flex-col justify-center px-4 py-4 md:px-8 md:py-16">
          <p className="label-caps text-rose-gold text-xs">
            The signature piece
          </p>
          <h2 className="font-display text-ink mt-2 text-4xl leading-[1.06] font-bold text-balance md:text-6xl">
            {product.title}
          </h2>
          <p className="font-serif-alt text-ink-55 mt-4 max-w-md text-xl leading-tight italic md:mt-5">
            Hand-embroidered over months, cut to a single measure, no two are
            ever finished the same way.
          </p>

          <div className="stitch-divider mt-12 md:mt-20" />

          <div className="mt-12 flex flex-col-reverse items-start gap-2 md:mt-20">
            <Link
              href={`/shop/${product.slug}`}
              className="label-caps btn-focus text-ink hover:bg-rose-gold hover:text-paper w-full rounded-sm px-10 py-4 text-center text-xs shadow-[inset_0_0_0_1.5px_var(--color-rose-gold)] transition-colors md:w-auto"
            >
              Begin your commission
            </Link>
            <p className="text-ink-55 ml-1 text-xs">
              From {formatAmount(fromPrice, { fractionalDigits: 0 })}
            </p>
          </div>
        </div>

        {/* image */}
        <div className="aspect-4/5 p-4 md:aspect-auto md:min-h-140 md:p-0">
          <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-none">
            {image && (
              <Image
                fill
                src={image.url}
                alt=""
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
