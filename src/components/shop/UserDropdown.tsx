"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  XIcon,
  PackageIcon,
  HeartIcon,
  MapPinIcon,
  LogOutIcon,
  SparklesIcon,
  ChevronRightIcon,
  UserIcon,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  animate,
  type Variants,
  type PanInfo,
} from "motion/react";

type UserDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  /** The element that toggles the dropdown — ignored by the outside-click handler. */
  triggerRef?: RefObject<HTMLElement | null>;
};

const MENU_ITEMS = [
  { label: "My Profile", href: "/account", Icon: UserIcon },
  { label: "My Orders", href: "/orders", Icon: PackageIcon },
  { label: "Wishlist", href: "/wishlist", Icon: HeartIcon },
  { label: "Addresses", href: "/account/addresses", Icon: MapPinIcon },
];

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

/** Parent container — orchestrates the stagger. */
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
            className="fixed inset-0 z-60 bg-ink/40 backdrop-blur-sm md:hidden"
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
              "fixed inset-x-0 bottom-0 z-70 w-full overflow-hidden rounded-t-3xl bg-paper text-ink shadow-2xl ring-1 ring-ink-08",
              "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-3 md:w-80 md:origin-top-right md:rounded-2xl",
              "transform-gpu will-change-transform",
            ].join(" ")}
          >
            {/* Mobile grab handle */}
            <div className="flex justify-center pt-3 md:hidden cursor-grab active:cursor-grabbing">
              <span className="h-1.5 w-11 rounded-full bg-ink-15" />
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
                className="flex items-start justify-between gap-4 px-6 pt-5 pb-4"
              >
                <div className="min-w-0">
                  <p className="font-label text-[11px] font-semibold uppercase tracking-[2] text-rose-gold">
                    {isSignedIn ? "My Account" : "Welcome to"}
                  </p>
                  {isPending ? (
                    <div className="mt-2 h-6 w-40 animate-pulse rounded bg-ink-08" />
                  ) : isSignedIn ? (
                    <h2 className="mt-1 truncate font-display text-2xl font-bold leading-tight text-ink">
                      Hello{firstName ? `, ${firstName}` : ""}
                    </h2>
                  ) : (
                    <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-ink">
                      shreeforstree
                    </h2>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="group shrink-0 rounded-full border border-ink-15 p-2.5 transition-all duration-300 ease-in-out hover:bg-ink"
                >
                  <XIcon
                    size={16}
                    className="stroke-[1.7] text-ink transition-colors duration-300 ease-in-out group-hover:text-paper"
                  />
                </button>
              </motion.div>

              {isSignedIn && !isPending && (
                <motion.div
                  variants={staggerItem}
                  className="mx-6 mb-1 flex items-center gap-3 rounded-xl bg-ink-05 px-4 py-3"
                >
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "avatar"}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-ink-15"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-gold font-display text-lg font-bold text-paper">
                      {initial}
                    </span>
                  )}
                  <div className="min-w-0">
                    {session?.user?.name && (
                      <p className="truncate font-body text-sm font-semibold text-ink">
                        {session.user.name}
                      </p>
                    )}
                    <p className="truncate font-body text-xs text-ink-55">
                      {session?.user?.email}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Body */}
              <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:pb-3">
                {isPending ? (
                  <div className="space-y-2 px-3 py-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-full animate-pulse rounded-lg bg-ink-05"
                      />
                    ))}
                  </div>
                ) : isSignedIn ? (
                  <>
                    {MENU_ITEMS.map(({ label, href, Icon }) => (
                      <motion.div key={href} variants={staggerItem}>
                        <Link
                          href={href}
                          onClick={onClose}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-ink-05"
                        >
                          <Icon
                            size={18}
                            className="stroke-[1.5] text-ink-55 transition-colors group-hover:text-rose-gold"
                          />
                          <span className="flex-1 font-body text-sm text-ink transition-colors group-hover:text-rose-gold">
                            {label}
                          </span>
                          <ChevronRightIcon
                            size={16}
                            className="text-ink-25 transition-all group-hover:translate-x-0.5 group-hover:text-rose-gold"
                          />
                        </Link>
                      </motion.div>
                    ))}

                    <motion.div
                      variants={staggerItem}
                      className="my-2 h-px bg-ink-08"
                    />

                    <motion.div variants={staggerItem}>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-rust/10 disabled:opacity-60"
                      >
                        <LogOutIcon
                          size={18}
                          className="stroke-[1.5] text-ink-55 transition-colors group-hover:text-rust"
                        />
                        <span className="flex-1 text-left font-body text-sm text-ink transition-colors group-hover:text-rust">
                          {signingOut ? "Signing out…" : "Sign Out"}
                        </span>
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <div className="px-3 pb-2">
                    <motion.p
                      variants={staggerItem}
                      className="mb-4 font-serif-alt text-lg leading-snug text-ink-55"
                    >
                      Sign in to track orders, save your wishlist, and check out
                      faster.
                    </motion.p>

                    <motion.div variants={staggerItem}>
                      <Link
                        href="/sign-in"
                        onClick={onClose}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-label text-sm font-semibold uppercase tracking-[1.5] text-paper transition-colors hover:bg-rose-gold"
                      >
                        Sign In
                      </Link>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <Link
                        href="/sign-up"
                        onClick={onClose}
                        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-ink-15 py-3 font-label text-sm font-semibold uppercase tracking-[1.5] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
                      >
                        Create Account
                      </Link>
                    </motion.div>

                    <motion.p
                      variants={staggerItem}
                      className="mt-4 flex items-center justify-center gap-1.5 font-body text-xs text-ink-40"
                    >
                      <SparklesIcon size={13} className="text-rose-gold" />
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
