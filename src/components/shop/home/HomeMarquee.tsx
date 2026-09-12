"use client";

import ArrowLeft from "@/components/ui/Icon";
import {
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useVelocity,
  motion,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const NOTES = [
  "Made to order",
  "Hand embroidered",
  "Cut to a single measure",
  "Bridal · Festive · Ethnic",
  "Stitched with intention",
  "A family craft",
];

export default function HomeMarquee() {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const directionFactor = useRef(1);
  const [isScrollingDown, setIsScrollingDown] = useState(true);

  const baseSpeed = 2.5; //Adjust to change the speed of the marquee

  useEffect(() => {
    return scrollVelocity.on("change", (latestVelocity) => {
      if (latestVelocity > 0) {
        directionFactor.current = 1;
        setIsScrollingDown(true);
      } else if (latestVelocity < 0) {
        directionFactor.current = -1;
        setIsScrollingDown(false);
      }
    });
  }, [scrollVelocity]);

  useAnimationFrame((_, delta) => {
    const moveBy = directionFactor.current * baseSpeed * (delta / 1000);

    let newX = baseX.get() - moveBy;

    if (newX <= -50) newX = 0;
    if (newX > 0) newX = -50;

    baseX.set(newX);
  });
  return (
    <div className="border-blush/12 bg-ink-deep overflow-hidden border-y py-3.5">
      <motion.div
        style={{ x: useTransform(baseX, (v) => `${v}%`) }}
        className="flex w-max"
      >
        {[0, 1].map((pass) =>
          NOTES.map((note) => (
            <span
              key={`${pass}-${note}`}
              aria-hidden={pass === 1 || undefined}
              className="label-caps text-blush flex items-center gap-14 px-7 text-[0.7rem] whitespace-nowrap"
            >
              {note}

              <motion.span
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                animate={{ rotate: isScrollingDown ? 0 : 180 }}
                className="inline-block"
              >
                <ArrowLeft
                  height="auto"
                  width="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </motion.span>
            </span>
          )),
        )}
      </motion.div>
    </div>
  );
}
