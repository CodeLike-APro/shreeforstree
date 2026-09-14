"use client";

import { ArrowLink } from "@/components/ui/ArrowLink";
import { Ring } from "@/components/ui/Icon";
import { HERO_SLIDE_INTERVAL_MS } from "@/lib/constants";
import type { HomeData } from "@/lib/queries/home";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const excerpt = (text: string) =>
  text.length > 130 ? `${text.slice(0, 130).trimEnd()}…` : text.trimEnd();

export default function HomeHero({
  products,
}: {
  products: HomeData["heroProducts"];
}) {
  const slides = products.filter((p) => p.productMedia[0] !== undefined);
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const rotates = count > 1 && !reducedMotion;
  const startedAtRef = useRef(0);
  const remainingRef = useRef(HERO_SLIDE_INTERVAL_MS);

  useEffect(() => {
    if (!rotates || paused) return;

    startedAtRef.current = Date.now();
    const timer = setTimeout(() => {
      remainingRef.current = HERO_SLIDE_INTERVAL_MS;
      setActive((current) => (current + 1) % count);
    }, remainingRef.current);

    return () => clearTimeout(timer);
  }, [active, count, paused, rotates]);

  const pause = () => {
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current),
    );
    setPaused(true);
  };

  const resume = () => {
    setPaused(false);
  };

  return (
    <>
      {count === 0 && (
        <section className="bg-ink-deep relative flex h-[70svh] min-h-112 flex-col justify-between overflow-hidden px-4 pt-6 pb-10 md:px-8 md:pb-14">
          <div />
          <div className="max-w-2xl">
            <p className="label-caps text-rose-gold text-[0.7rem]">
              One piece, made once
            </p>
            <h1 className="font-display text-paper mt-4 text-4xl leading-[1.05] font-bold md:text-6xl lg:text-7xl">
              shreeforstree
            </h1>
            <p className="font-serif-alt text-blush mt-4 max-w-md text-lg leading-snug italic md:mt-5 md:text-2xl">
              No mass production, what you order is what gets stitched.
            </p>
            <Link
              href="/shop"
              className="label-caps bg-rose-gold text-paper hover:bg-rose-gold-dark btn-focus mt-7 inline-block rounded-sm px-8 py-4 text-[0.7rem] transition-colors md:mt-8"
            >
              Enter the shop
            </Link>
          </div>
        </section>
      )}
      {count !== 0 && (
        <section
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
          className="bg-ink-deep relative isolate flex h-[82svh] min-h-136 flex-col justify-between overflow-hidden px-4 pt-6 pb-10 md:px-8 md:pb-14"
        >
          {/* Layer- 1: Backgrounds Loop */}

          {slides.map((slide, i) => (
            <div
              key={slide.id}
              aria-hidden
              className={`absolute inset-0 -z-10 transition-opacity duration-1000 ease-out motion-reduce:transition-none ${i === active ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                fill
                priority={i === 0}
                sizes="100vw"
                alt=""
                src={slide.productMedia[0].url}
                className={`object-cover ${count > 1 ? "animate-ken-burns" : ""}`}
              />
            </div>
          ))}

          {/* Layer- 2: Overlay */}
          <div className="from-ink-deep/90 via-ink-deep/30 to-ink-deep/55 absolute inset-0 -z-10 bg-linear-to-t" />

          {/* Layer- 3: Top Row */}

          <div className="flex items-center justify-between gap-4">
            <div className="grid">
              {slides.map((slide, i) => (
                <p
                  key={slide.id}
                  className={`font-label text-blush/70 col-start-1 row-start-1 text-[0.6rem] font-bold tracking-widest uppercase transition-opacity duration-700 ease-out motion-reduce:transition-none md:text-[0.7rem] ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
                >
                  {slide.categories.map((c) => c.category.title).join(" · ") ||
                    "One piece, made once"}
                </p>
              ))}
            </div>
            <ArrowLink
              title="Enter the shop"
              href="/shop"
              textColor="text-blush"
            />
          </div>

          {/* Layer- 4: Details */}

          <div className="grid max-w-2xl">
            {slides.map((slide, i) => (
              /* loop 3 — per-slide copy, same stacking */
              <div
                key={slide.id}
                aria-hidden={i !== active || undefined}
                className={`col-start-1 row-start-1 transition-opacity duration-700 ease-out motion-reduce:transition-none ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <h1 className="font-display text-paper text-4xl leading-[1.05] font-bold text-balance md:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>
                <p className="font-serif-alt text-blush mt-4 line-clamp-2 max-w-md text-lg leading-snug italic md:mt-5 md:text-2xl">
                  {excerpt(slide.description)}
                </p>
                <Link
                  href={`/shop/${slide.slug}`}
                  className="label-caps btn-focus bg-rose-gold text-paper hover:bg-rose-gold-dark mt-7 inline-block rounded-sm px-6 py-3.5 text-[0.7rem] transition-colors md:mt-8"
                >
                  Shop this piece
                </Link>
              </div>
            ))}
          </div>

          {/* Layer- 5: Dots */}

          {count > 1 && (
            <div className="absolute right-4 bottom-8 flex items-center md:right-8 md:bottom-10">
              {slides.map((slide, i) => (
                /* loop 4 */
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={i === active}
                  aria-label={`Show piece ${i + 1}`}
                  className="btn-focus flex size-6 items-center justify-center"
                >
                  <Ring
                    active={i === active}
                    paused={paused}
                    className="size-2.5 -rotate-90 overflow-visible"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
