"use client";

import { ChevronRight, LogOut, Sparkles, X } from "lucide-react";
import {
  animate,
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
  type Variants,
} from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";

export interface UserDropdownItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

type UserDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  /** The element that toggles the dropdown ignored by the outside-click handler. */
  triggerRef?: RefObject<HTMLElement | null>;
  items: readonly UserDropdownItem[] | UserDropdownItem[];
  direction?: "up" | "down";
  variant?: "default" | "minimal";
};

/* ─── Motion variants ──────────────────────────────────────────────── */

const scrimVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelDesktopVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 26,
      stiffness: 300,
      mass: 0.8,
    },
  },
};

const panelMobileVariants: Variants = {
  hidden: {
    y: "100%",
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    y: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 320,
      mass: 0.9,
    },
  },
};

/** Parent container- orchestrates the stagger. */
const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.08,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
};

/** Each child item fades + slides up. */
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 260 },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.12, ease: "easeIn" },
  },
};

export default function UserDropdown({
  isOpen,
  onClose,
  triggerRef,
  items,
  direction = "down",
  variant = "default",
}: UserDropdownProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Drag-to-dismiss: track the panel's vertical offset while dragging.
  const dragY = useMotionValue(0);

  // Track viewport for the mobile swipe gesture + body-scroll lock.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Close on: outside click + Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      // Let the trigger's own onClick handle its toggle instead of double-firing.
      if (triggerRef?.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, triggerRef]);

  // Reset dragY before paint when the panel opens.
  useLayoutEffect(() => {
    if (isOpen) dragY.jump(0);
  }, [isOpen, dragY]);

  // Drag-to-dismiss handler: dismiss if dragged far enough or with velocity.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const panelH = panelRef.current?.offsetHeight ?? 400;
    const threshold = panelH * 0.3;
    if (info.offset.y > threshold || info.velocity.y > 400) {
      // Animate the panel off-screen, then close.
      animate(dragY, panelH, {
        type: "spring",
        damping: 30,
        stiffness: 300,
      }).then(() => onClose());
    } else {
      // Snap back.
      animate(dragY, 0, {
        type: "spring",
        damping: 25,
        stiffness: 400,
      });
    }
  };

  // Lock body scroll while the sheet is open on mobile.
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      onClose();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const firstName =
    session?.user?.name?.trim().split(" ")[0] || session?.user?.name || "";
  const initial = (
    session?.user?.name?.trim()?.[0] ||
    session?.user?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile scrim — tap to close */}
          <motion.div
            key="user-dropdown-scrim"
            aria-hidden
            onClick={onClose}
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-ink/40 fixed inset-0 z-60 backdrop-blur-sm md:hidden"
          />

          {/* Panel */}
          <motion.div
            key="user-dropdown-panel"
            ref={panelRef}
            role="menu"
            aria-label="Account menu"
            variants={isMobile ? panelMobileVariants : panelDesktopVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            // Drag-to-dismiss on mobile
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 500 }}
            dragElastic={{ top: 0.05, bottom: 0 }}
            dragMomentum={false}
            onDragEnd={isMobile ? handleDragEnd : undefined}
            style={isMobile ? { y: dragY } : undefined}
            className={[
              "bg-paper text-ink ring-ink-08 fixed inset-x-0 bottom-0 z-70 w-full overflow-hidden rounded-t-3xl shadow-2xl ring-1",
              "md:absolute md:inset-x-auto md:rounded-2xl",
              variant === "minimal" ? "md:w-60" : "md:w-80",
              direction === "up"
                ? "md:bottom-full md:left-0 md:mb-0 md:origin-bottom-left"
                : "md:top-full md:right-0 md:bottom-auto md:mt-3 md:origin-top-right",
              "transform-gpu will-change-transform",
            ].join(" ")}
          >
            {/* Mobile grab handle */}
            <div className="flex cursor-grab justify-center pt-3 active:cursor-grabbing md:hidden">
              <span className="bg-ink-15 h-1.5 w-11 rounded-full" />
            </div>

            {/* Content — staggered reveal */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <motion.div
                variants={staggerItem}
                className={`flex items-start justify-between gap-4 ${
                  variant === "minimal" ? "hidden pt-3 pb-0" : "px-6 pt-5 pb-4"
                }`}
              >
                <div className="min-w-0">
                  {variant !== "minimal" && (
                    <>
                      <p className="font-label text-rose-gold text-[11px] font-semibold tracking-[2] uppercase">
                        {isSignedIn ? "My Account" : "Welcome to"}
                      </p>
                      {isPending ? (
                        <div className="bg-ink-08 mt-2 h-6 w-40 animate-pulse rounded" />
                      ) : isSignedIn ? (
                        <h2 className="font-display text-ink mt-1 truncate text-2xl leading-tight font-bold">
                          Hello{firstName ? `, ${firstName}` : ""}
                        </h2>
                      ) : (
                        <h2 className="font-display text-ink mt-1 text-2xl leading-tight font-bold">
                          shreeforstree
                        </h2>
                      )}
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="group border-ink-15 btn-focus hover:bg-ink shrink-0 rounded-full border p-2.5 transition-all duration-300 ease-in-out"
                >
                  <X
                    size={16}
                    className="text-ink group-hover:text-paper stroke-[1.7] transition-colors duration-300 ease-in-out"
                  />
                </button>
              </motion.div>

              {isSignedIn && !isPending && (
                <motion.div
                  variants={staggerItem}
                  className={`flex items-center gap-3 rounded-xl ${
                    variant === "minimal"
                      ? "mx-3 mt-1 mb-0 px-0 py-2"
                      : "bg-ink-05 mx-6 mb-1 px-4 py-3"
                  }`}
                >
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "avatar"}
                      className="ring-ink-15 h-10 w-10 shrink-0 rounded-full object-cover ring-1"
                    />
                  ) : (
                    <span className="bg-rose-gold font-display text-paper flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                      {initial}
                    </span>
                  )}
                  <div className="min-w-0">
                    {session?.user?.name && (
                      <p className="font-body text-ink truncate text-sm font-semibold">
                        {session.user.name}
                      </p>
                    )}
                    <p className="font-body text-ink-55 truncate text-xs">
                      {session?.user?.email}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Body */}
              <div
                className={`px-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-3 ${
                  variant === "minimal" ? "pt-1" : "pt-2"
                }`}
              >
                {isPending ? (
                  <div className="space-y-2 px-3 py-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-ink-05 h-10 w-full animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                ) : isSignedIn ? (
                  <>
                    {items.map(({ label, href, icon }) => (
                      <motion.div key={href} variants={staggerItem}>
                        <Link
                          href={href}
                          onClick={onClose}
                          className="group btn-focus hover:bg-ink-05 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200"
                        >
                          {React.isValidElement(icon) &&
                            React.cloneElement(
                              icon as React.ReactElement<{
                                size?: number;
                                className?: string;
                              }>,
                              {
                                size: 18,
                                className: `stroke-[1.5] text-ink-55 transition-colors group-hover:text-rose-gold ${
                                  (icon.props as { className?: string })
                                    .className || ""
                                }`,
                              },
                            )}
                          <span className="font-body text-ink group-hover:text-rose-gold flex-1 text-sm transition-colors">
                            {label}
                          </span>
                          <ChevronRight
                            size={16}
                            className="text-ink-25 group-hover:text-rose-gold transition-all group-hover:translate-x-0.5"
                          />
                        </Link>
                      </motion.div>
                    ))}

                    <motion.div
                      variants={staggerItem}
                      className="bg-ink-08 my-2 h-px"
                    />

                    <motion.div variants={staggerItem}>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="group text-rust btn-focus hover:bg-rust/10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 disabled:opacity-60"
                      >
                        <LogOut
                          size={18}
                          className="group-hover:text-rust stroke-[1.5] transition-colors"
                        />
                        <span className="font-body group-hover:text-rust flex-1 text-left text-sm transition-colors">
                          {signingOut ? "Signing out…" : "Sign Out"}
                        </span>
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <div className="px-3 pb-2">
                    <motion.p
                      variants={staggerItem}
                      className="font-serif-alt text-ink-55 mb-4 text-lg leading-snug"
                    >
                      Sign in to track orders, save your wishlist, and check out
                      faster.
                    </motion.p>

                    <motion.div variants={staggerItem}>
                      <Link
                        href="/sign-in"
                        onClick={onClose}
                        className="bg-ink font-label btn-focus text-paper hover:bg-rose-gold flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold tracking-[1.5] uppercase transition-colors"
                      >
                        Sign In
                      </Link>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <Link
                        href="/sign-up"
                        onClick={onClose}
                        className="border-ink-15 btn-focus font-label text-ink hover:border-rose-gold hover:text-rose-gold mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold tracking-[1.5] uppercase transition-colors"
                      >
                        Create Account
                      </Link>
                    </motion.div>

                    <motion.p
                      variants={staggerItem}
                      className="font-body text-ink-40 mt-4 flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Sparkles size={13} className="text-rose-gold" />
                      Crafted for you, by shreeforstree
                    </motion.p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
