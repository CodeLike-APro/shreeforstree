"use client";

import { ArrowLink } from "@/components/ui/ArrowLink";
import type { HomeData } from "@/lib/queries/home";
import Card from "@/utils/Card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function NewArrivalsRail({
  newArrivals,
}: {
  newArrivals: HomeData["newArrivals"];
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });
  const reducedMotion = useReducedMotion();

  const checkScroll = useCallback(() => {
    if (!railRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
    setEdges({
      atStart: scrollLeft <= 2,
      atEnd: Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scrollByPage = (direction: number) => {
    if (!railRef.current) return;
    const scrollAmount = railRef.current.clientWidth * 0.8;
    railRef.current.scrollBy({
      left: scrollAmount * direction,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-full px-4 py-16 md:px-8 md:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-caps text-rose-gold text-xs">
            Freshly off the table
          </p>
          <h2 className="font-display text-ink mt-3 text-3xl leading-tight font-bold md:text-5xl">
            New Arrivals
          </h2>
        </div>
        <ArrowLink href="/shop?isNewArrival=true" title="Shop all new" />
      </div>

      <div className="group/rail relative mt-10">
        {/* arrows — desktop only, revealed on hover or keyboard focus */}
        <div className="pointer-events-none absolute inset-y-0 -right-6 -left-6 z-10 hidden items-center justify-between opacity-0 transition-opacity duration-300 group-focus-within/rail:opacity-100 group-hover/rail:opacity-100 md:flex">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll left"
            className={`btn-focus border-ink-15 bg-paper text-ink hover:bg-ink hover:text-paper pointer-events-auto flex size-12 items-center justify-center rounded-full border shadow-sm transition ${edges.atStart ? "invisible" : ""}`}
          >
            <ChevronLeft strokeWidth={1.5} className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Scroll right"
            className={`btn-focus border-ink-15 bg-paper text-ink hover:bg-ink hover:text-paper pointer-events-auto flex size-12 items-center justify-center rounded-full border shadow-sm transition ${edges.atEnd ? "invisible" : ""}`}
          >
            <ChevronRight strokeWidth={1.5} className="size-5" />
          </button>
        </div>

        <div
          ref={railRef}
          onScroll={checkScroll}
          className="flex snap-x snap-mandatory scrollbar-none gap-4 overflow-x-auto pb-2 md:gap-6"
        >
          {newArrivals.map((product) => (
            <Card
              key={product.id}
              variant="customer-product"
              data={product}
              href={`/shop/${product.slug}`}
              className="w-[62%] snap-start sm:w-[42%] lg:w-[30%] xl:w-[23%]"
              sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 42vw, 62vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
