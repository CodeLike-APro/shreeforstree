"use client";
import type { productMedia } from "@/lib/db/schema";
import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  productMedia: (typeof productMedia.$inferSelect)[];
  productTitle?: string;
};

export default function ProductGallery({
  productMedia,
  productTitle,
}: ProductGalleryProps) {
  const [activeUrl, setActiveUrl] = useState(productMedia[0]?.url);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  const scrollerRef = (el: HTMLDivElement | null) => {
    if (!el) return;

    const measure = () => {
      setScrollPosition(el.scrollTop);
      setMaxScroll(el.scrollHeight - el.clientHeight);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  };

  return (
    <div className="w-full">
      <div className="flex gap-4">
        <div className="relative w-28 shrink-0">
          <div
            ref={scrollerRef}
            onScroll={(e) => {
              setScrollPosition(e.currentTarget.scrollTop);
              setMaxScroll(
                e.currentTarget.scrollHeight - e.currentTarget.clientHeight,
              );
            }}
            tabIndex={-1}
            className={[
              "absolute inset-0 flex scrollbar-none flex-col gap-3 overflow-y-auto px-0.5 py-0.5",

              scrollPosition > 0 ? "mask-t-from-85% mask-t-to-100%" : "",

              scrollPosition < maxScroll
                ? "mask-b-from-85% mask-b-to-100%"
                : "",
            ].join(" ")}
          >
            {productMedia.map((m) => (
              <button key={m.id} className="btn-focus w-24 rounded-md">
                <Image
                  onClick={() => {
                    setActiveUrl(m.url);
                  }}

                  src={m.url}
                  alt={productTitle ?? "Product Image"}
                  width={300}
                  height={400}
                  className={[
                    "aspect-3/4 w-24 rounded-md object-cover",
                    activeUrl === m.url ? "border-rose-gold border-[2.5]" : "",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="w-[80%]">
          <button className="btn-focus w-full rounded-md">
            <Image
              src={activeUrl}
              alt={productTitle ?? "Product Image"}
              width={600}
              height={800}
              className="aspect-3/4 rounded-md object-cover"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
