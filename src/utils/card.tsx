"use client";

import { EllipsisVertical, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "motion/react";

export type CardVariant =
  | "customer-product"
  | "admin-product"
  | "admin-category";

export interface CardMedia {
  url: string;
  type?: "image" | "video";
  sortOrder?: number;
  isHero?: boolean;
  isFabricSwatch?: boolean;
}

/**
 * Accepts the raw API shapes directly:
 *   - products  → `paginated()` items with `productMedia[]`, string prices, flags
 *   - categories → `ok()` items with `categoryImageUrl`
 * Prices arrive as numeric strings from Postgres, so `price`/`discountedPrice`
 * are typed loosely and coerced with Number() before use.
 */
export interface CardData {
  id: string;
  title: string;
  // Media — provide any one; the card resolves them into a gallery.
  images?: string[];
  image?: string | null;
  productMedia?: CardMedia[];
  categoryImageUrl?: string | null;
  // Pricing (numeric strings from DB, or numbers)
  price?: number | string | null;
  discountedPrice?: number | string | null;
  // Flags
  isActive?: boolean;
  isNewArrival?: boolean;
  isHeroProduct?: boolean;
  // Explicit tags override the flags-derived ones
  tags?: { label: string; type: "new" | "hero" | string }[];
}

export interface CardProps {
  variant: CardVariant;
  data: CardData;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onViewOnStore?: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: boolean) => void;
  onDelete?: (id: string) => void;
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 260 },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

export default function Card({
  variant,
  data,
  onClick,
  onEdit,
  onViewOnStore,
  onToggleStatus,
  onDelete,
}: CardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSide, setDropdownSide] = useState<"left" | "right">("right");
  const [dropdownVertical, setDropdownVertical] = useState<"up" | "down">(
    "down",
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const isAdmin = variant === "admin-product" || variant === "admin-category";
  const showTags = variant === "admin-product";
  const showPrices =
    variant === "customer-product" || variant === "admin-product";
  const isInactive = data.isActive === false;

  // Resolve the various API media shapes into a single ordered image list.
  const images = useMemo(() => {
    if (data.images?.length) return data.images.filter(Boolean);
    if (data.productMedia?.length) {
      return [...data.productMedia]
        .filter((m) => (m.type ?? "image") === "image" && !m.isHero)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((m) => m.url)
        .filter(Boolean);
    }
    const single = data.image || data.categoryImageUrl;
    return single ? [single] : [];
  }, [data]);

  const displayImages = images.length ? images : ["/images/white.webp"];
  // Three-zone hover / swipe gallery is customer-facing only.
  const hasGallery =
    variant === "customer-product" && displayImages.length > 1;
  const safeIndex = Math.min(activeIndex, displayImages.length - 1);

  // Prices come back as numeric strings from Postgres.
  const toNumber = (value: number | string | null | undefined) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const price = toNumber(data.price);
  const discountedPrice = toNumber(data.discountedPrice);
  const hasDiscount = discountedPrice > 0 && discountedPrice < price;

  // Derive tags from product flags when none are explicitly provided.
  const tags =
    data.tags ??
    [
      ...(data.isHeroProduct ? [{ label: "Hero", type: "hero" }] : []),
      ...(data.isNewArrival ? [{ label: "New", type: "new" }] : []),
    ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCardClick = () => {
    if (onClick) onClick(data.id);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (rect.right + 160 > window.innerWidth) {
        setDropdownSide("left");
      } else {
        setDropdownSide("right");
      }
      // Flip upward when there isn't enough room below for the menu.
      const estimatedMenuHeight = 240;
      if (rect.bottom + estimatedMenuHeight > window.innerHeight) {
        setDropdownVertical("up");
      } else {
        setDropdownVertical("down");
      }
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleAction = (e: React.MouseEvent, action?: (id: string) => void) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (action) action(data.id);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onToggleStatus) onToggleStatus(data.id, data.isActive ?? true);
  };

  const handleDeleteConfirm = () => {
    if (deleteInput.trim().toLowerCase() === data.title.trim().toLowerCase()) {
      if (onDelete) onDelete(data.id);
      setIsDeleteDialogOpen(false);
      setDeleteInput("");
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mobile: horizontal swipe cycles through the gallery images.
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (dx <= -threshold) {
      setActiveIndex((i) => Math.min(i + 1, displayImages.length - 1));
    } else if (dx >= threshold) {
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  return (
    <div className="select-none shrink-0">
      <div
        className="w-64 rounded-sm cursor-pointer group"
        onClick={handleCardClick}
        onMouseLeave={() => hasGallery && setActiveIndex(0)}
      >
        <div
          className="w-full relative overflow-hidden rounded-sm"
          onTouchStart={hasGallery ? handleTouchStart : undefined}
          onTouchEnd={hasGallery ? handleTouchEnd : undefined}
        >
          <div className="relative w-64 aspect-3/4">
            {displayImages.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={data.title}
                loading={index === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 w-full h-full object-cover rounded-sm transition-opacity duration-300 ${
                  index === safeIndex ? "opacity-100" : "opacity-0"
                } ${isInactive && isAdmin ? "opacity-70" : ""}`}
              />
            ))}

            {/* Desktop: three vertical hover zones map to each image. */}
            {hasGallery && (
              <div className="absolute inset-0 hidden sm:flex">
                {displayImages.map((_, index) => (
                  <div
                    key={index}
                    className="h-full flex-1"
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Dots indicate the active image (both hover and swipe). */}
            {hasGallery && (
              <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`View image ${index + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(index);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === safeIndex
                        ? "w-4 bg-paper"
                        : "w-1.5 bg-paper/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {showTags && tags.length > 0 && (
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-2 items-start">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className={`text-[0.6rem] font-bold py-1 px-2 uppercase tracking-widest ${
                    tag.type === "hero"
                      ? "bg-ink text-paper"
                      : "bg-paper text-rose-gold"
                  }`}
                >
                  {tag.label}
                </div>
              ))}
            </div>
          )}

          {isAdmin && isInactive && (
            <div className="flex items-center justify-center gap-2 absolute top-2 right-2 z-10 bg-paper text-rust text-[0.6rem] font-bold py-1 px-2 uppercase tracking-widest rounded-full">
              <div className="w-1.5 h-1.5 bg-rust rounded-full"></div>
              <p>Inactive</p>
            </div>
          )}
        </div>

        <div className="w-full flex items-start justify-between py-2 relative">
          <div className="overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-start min-h-8">
              <h1 className="text-lg text-ink line-clamp-2 leading-tight">
                {data.title}
              </h1>
            </div>
            {showPrices && (
              <div className="flex items-center gap-2 mt-1">
                {hasDiscount ? (
                  <>
                    <p className="text-md text-rose-gold tracking-wide">
                      {formatPrice(discountedPrice)}
                    </p>
                    <p className="text-xs text-ink-40 line-through">
                      {formatPrice(price)}
                    </p>
                  </>
                ) : (
                  <p className="text-md text-rose-gold tracking-wide">
                    {formatPrice(price)}
                  </p>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div
              className="flex items-center justify-center mt-1 relative ml-2 shrink-0"
              ref={dropdownRef}
            >
              <button
                onClick={handleDropdownClick}
                className="w-5 h-7 flex items-center justify-center bg-paper border-[1.5px] border-ink text-ink p-0.5 rounded-[20vw] hover:bg-ink hover:text-paper transition-all duration-300"
              >
                <EllipsisVertical size={16} className="stroke-[1.7] shrink-0" />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                      y: dropdownVertical === "down" ? -8 : 8,
                    }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      y: dropdownVertical === "down" ? -8 : 8,
                    }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={`absolute ${
                      dropdownVertical === "down" ? "top-8" : "bottom-8"
                    } ${
                      dropdownSide === "right"
                        ? dropdownVertical === "down"
                          ? "left-0 origin-top-left"
                          : "left-0 origin-bottom-left"
                        : dropdownVertical === "down"
                          ? "right-0 origin-top-right"
                          : "right-0 origin-bottom-right"
                    } bg-paper ring-1 ring-ink-08 shadow-2xl rounded-xl w-40 z-20 p-1.5`}
                  >
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex flex-col"
                    >
                      <motion.div variants={staggerItem}>
                        <button
                          onClick={(e) => handleAction(e, onEdit)}
                          className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-ink-05 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </motion.div>
                      <motion.div variants={staggerItem}>
                        <button
                          onClick={(e) => handleAction(e, onViewOnStore)}
                          className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-ink-05 rounded-lg transition-colors"
                        >
                          View on Store
                        </button>
                      </motion.div>
                      <motion.div variants={staggerItem}>
                        <button
                          onClick={handleToggleStatus}
                          className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-ink-05 rounded-lg transition-colors"
                        >
                          {data.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <div className="my-1 h-px bg-ink-08" />
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-rust hover:bg-rust/10 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {isDeleteDialogOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-100 bg-ink-55 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-paper rounded-sm p-6 w-full max-w-md shadow-card relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-ink">
                  Delete {variant === "admin-category" ? "Category" : "Product"}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(false);
                    setDeleteInput("");
                  }}
                  className="text-ink-40 hover:text-ink transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <img
                  src={displayImages[0]}
                  alt={data.title}
                  className="w-20 h-20 object-cover rounded-sm shadow-sm"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-ink-55 mb-1">
                    Are you sure you want to delete this{" "}
                    {variant === "admin-category" ? "category" : "product"}?
                  </p>
                  <p className="font-semibold text-ink line-clamp-2">
                    {data.title}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-ink-55 mb-2">
                  Type{" "}
                  <span className="font-bold text-ink select-none">
                    {data.title}
                  </span>{" "}
                  to confirm.
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={data.title}
                  className="w-full border border-ink-25 rounded-sm px-3 py-2 text-ink outline-none focus:border-ink transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(false);
                    setDeleteInput("");
                  }}
                  className="px-4 py-2 text-ink border border-ink-25 rounded-sm hover:bg-ink-05 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConfirm();
                  }}
                  disabled={
                    deleteInput.trim().toLowerCase() !==
                    data.title.trim().toLowerCase()
                  }
                  className="px-4 py-2 bg-rust text-paper rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
