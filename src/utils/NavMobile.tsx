"use client";

import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface NavTab {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export interface NavMobileProps {
  tabs: readonly NavTab[] | NavTab[];
}

const PILL_SIZE = 52; // resting pill diameter in px
const ICON_SIZE = 22;
const NAV_H = 64;
const NAV_W = 290;
const NAV_PAD_X = 12;
const NAV_BORDER = 1;

type NavIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function NavMobile({ tabs }: NavMobileProps) {
  const CONTENT_W = NAV_W - 2 * (NAV_PAD_X + NAV_BORDER);
  const HALF_GAP = (CONTENT_W - tabs.length * PILL_SIZE) / (tabs.length * 2);
  const INITIAL_CX = NAV_BORDER + NAV_PAD_X + HALF_GAP + PILL_SIZE / 2;

  const isDraggingRef = useRef(false);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // During a drag the URL hasn't changed yet, so we highlight locally
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // URL-derived active tab; falls back to 0 on unknown routes
  const urlIndex = Math.max(
    0,
    tabs.findIndex((t) =>
      t.href === "/" ? pathname === "/" : pathname.startsWith(t.href),
    ),
  );
  const activeIndex = dragIndex ?? urlIndex;

  // Pill center X — snaps are spring-animated via animate(), drag sets it 1:1
  const pillX = useMotionValue(INITIAL_CX);
  // pillX is the pill's *center* — offset by half the pill for `left` positioning
  const pillLeft = useTransform(pillX, (v) => v - PILL_SIZE / 2);

  // Scale pill while dragging (expand → spring back), animated via animate()
  const pillScale = useMotionValue(1);

  // Glow intensity driven by drag scale
  const glowOpacity = useTransform(pillScale, [1, 1.25], [0.5, 0.85]);

  /** Returns the center-x of the Nth tab relative to the nav container */
  const getTabCenter = useCallback((index: number) => {
    const nav = navRef.current;
    const tab = tabRefs.current[index];
    if (!nav || !tab) return 0;
    const navRect = nav.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    return tabRect.left + tabRect.width / 2 - navRect.left;
  }, []);

  /** Snap pill to the tab at `index` */
  const snapTo = useCallback(
    (index: number) => {
      const cx = getTabCenter(index);
      animate(pillX, cx, {
        type: "spring",
        stiffness: 500,
        damping: 35,
        mass: 0.8,
      });
    },
    [getTabCenter, pillX],
  );

  /** Find closest tab to the current pill position */
  const findClosest = useCallback(() => {
    const current = pillX.get();
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < tabs.length; i++) {
      const cx = getTabCenter(i);
      const d = Math.abs(current - cx);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    }
    return closest;
  }, [getTabCenter, pillX, tabs.length]);

  // Keep a ref so the resize handler always reads the latest active index
  const urlIndexRef = useRef(urlIndex);
  useEffect(() => {
    urlIndexRef.current = urlIndex;
  }, [urlIndex]);

  // Initial position after mount + keep aligned on resize
  useEffect(() => {
    const place = () => {
      const cx = getTabCenter(urlIndexRef.current);
      pillX.jump(cx);
    };
    const id = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate pill whenever the active tab changes due to external navigation
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    snapTo(urlIndex);
  }, [urlIndex, snapTo]);

  // ── Gesture Handlers ─────────────────────────────────────────
  // Pan is attached to the whole nav container (the pill sits *under* the
  // tab buttons, so it can't receive pointer events itself).
  const handlePanStart = () => {
    isDraggingRef.current = true;
    pillX.stop(); // kill any in-flight snap animation
    animate(pillScale, 1.22, {
      type: "spring",
      stiffness: 400,
      damping: 18,
    });
  };

  const handlePan = (_: unknown, info: PanInfo) => {
    // Clamp the pill's center between the first and last tab centers
    const min = getTabCenter(0);
    const max = getTabCenter(tabs.length - 1);
    const raw = pillX.get() + info.delta.x;
    pillX.set(Math.max(min, Math.min(max, raw)));
    // Live-highlight the tab the pill is hovering over
    setDragIndex(findClosest());
  };

  const handlePanEnd = () => {
    animate(pillScale, 1, {
      type: "spring",
      stiffness: 600,
      damping: 22,
    });
    const closest = findClosest();
    snapTo(closest);
    router.push(tabs[closest].href);
    setDragIndex(null);
    // Clear after the pointerup-triggered click fires, so it isn't treated as a tap
    requestAnimationFrame(() => {
      isDraggingRef.current = false;
    });
  };

  const handleTap = (index: number) => {
    if (isDraggingRef.current) return;
    snapTo(index);
    router.push(tabs[index].href);
  };

  // Hide on form sub-pages (edit/create) so the nav doesn't cover the save bar
  const isFormSubPage =
    /^\/admin\/categories\/[^/]+$/.test(pathname) ||
    /^\/admin\/products\/[^/]+$/.test(pathname);
  if (isFormSubPage) return null;

  return (
    <nav className="pointer-events-none fixed right-0 bottom-0 left-0 z-80 flex items-center justify-center bg-linear-to-t from-black/20 to-transparent pb-5">
      <motion.div
        ref={navRef}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="pointer-events-auto relative flex touch-none items-center justify-around select-none"
        style={{
          height: NAV_H,
          width: NAV_W,
          borderRadius: 999,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.45)",
          padding: "0 12px",
        }}
      >
        {/* ── Animated Pill ────────────────────────────────── */}
        <motion.div
          style={{
            left: pillLeft,
            scale: pillScale,
            width: PILL_SIZE,
            height: PILL_SIZE,
            top: (NAV_H - PILL_SIZE) / 2 - 1, // -1 compensates nav border
          }}
          className="absolute"
        >
          {/* Glow layer */}
          <motion.div
            style={{ opacity: glowOpacity }}
            className="absolute inset-0 rounded-full"
            aria-hidden
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle, var(--color-rose-gold) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </motion.div>
          {/* Solid pill */}
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                "linear-gradient(145deg, var(--color-rose-gold) 0%, var(--color-rose-gold-dark) 100%)",
              boxShadow:
                "0 4px 16px oklch(0.6 0.086 34 / 0.35), inset 0 1px 1px oklch(1 0 0 / 0.15)",
            }}
          />
        </motion.div>

        {/* ── Tab Icons ────────────────────────────────────── */}
        {tabs.map((tab, i) => {
          const isActive = activeIndex === i;
          return (
            <motion.button
              key={tab.label}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              onClick={() => handleTap(i)}
              className="relative z-10 flex cursor-pointer items-center justify-center rounded-full"
              style={{
                width: PILL_SIZE,
                height: PILL_SIZE,
              }}
              aria-label={tab.label}
              whileTap={{ scale: 0.88 }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1 : 0.9,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 28,
                }}
              >
                {React.isValidElement(tab.icon) &&
                  React.cloneElement(
                    tab.icon as React.ReactElement<NavIconProps>,
                    {
                      size: ICON_SIZE,
                      strokeWidth: isActive ? 2.4 : 1.8,
                      className: "transition-colors duration-200",
                      style: {
                        color: isActive ? "white" : "var(--color-ink-55)",
                        ...((tab.icon as React.ReactElement<NavIconProps>).props
                          .style || {}),
                      },
                    },
                  )}
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>
    </nav>
  );
}
