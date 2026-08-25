"use client";

import { EllipsisVertical, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "motion/react";

export type CardVariant =
  "customer-product" | "admin-product" | "admin-category";

export interface CardMedia {
  url: string;
  type?: "image" | "video";
  sortOrder?: number;
  isHero?: boolean;
  isFabricSwatch?: boolean;
}

export interface CardData {
  id: string;
  title: string;
  images?: string[];
  image?: string | null;
  productMedia?: CardMedia[];
  categoryImageUrl?: string | null;
  price?: number | string | null;
  discountedPrice?: number | string | null;
  isActive?: boolean;
  isNewArrival?: boolean;
  isHeroProduct?: boolean;
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
  const hasGallery = variant === "customer-product" && displayImages.length > 1;
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
  const tags = data.tags ?? [
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
    <div className="shrink-0 select-none">
      <div
        className="group w-full cursor-pointer rounded-sm sm:w-64"
        onClick={handleCardClick}
        onMouseLeave={() => hasGallery && setActiveIndex(0)}
      >
        <div
          className="relative w-full overflow-hidden rounded-sm"
          onTouchStart={hasGallery ? handleTouchStart : undefined}
          onTouchEnd={hasGallery ? handleTouchEnd : undefined}
        >
          <div className="relative aspect-3/4 w-full sm:w-64">
            {displayImages.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={data.title}
                loading={index === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full rounded-sm object-cover transition-opacity duration-300 ${
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
              <div className="absolute right-0 bottom-2 left-0 z-10 flex justify-center gap-1.5">
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
                      index === safeIndex ? "bg-paper w-4" : "bg-paper/50 w-1.5"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {showTags && tags.length > 0 && (
            <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 text-[0.6rem] font-bold tracking-widest uppercase ${
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
            <div className="bg-paper text-rust absolute top-2 right-2 z-10 flex items-center justify-center gap-2 rounded-full px-2 py-1 text-[0.6rem] font-bold tracking-widest uppercase">
              <div className="bg-rust h-1.5 w-1.5 rounded-full"></div>
              <p>Inactive</p>
            </div>
          )}
        </div>

        <div className="relative flex w-full items-start justify-between py-2">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex min-h-8 items-center justify-start">
              <h1 className="text-ink line-clamp-2 text-lg leading-tight">
                {data.title}
              </h1>
            </div>
            {showPrices && (
              <div className="mt-1 flex items-center gap-2">
                {hasDiscount ? (
                  <>
                    <p className="text-md text-rose-gold tracking-wide">
                      {formatPrice(discountedPrice)}
                    </p>
                    <p className="text-ink-40 text-xs line-through">
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
              className="relative mt-1 ml-2 flex shrink-0 items-center justify-center"
              ref={dropdownRef}
            >
              <button
                onClick={handleDropdownClick}
                className="bg-paper border-ink text-ink hover:bg-ink hover:text-paper flex h-7 w-5 items-center justify-center rounded-[20vw] border-[1.5px] p-0.5 transition-all duration-300"
              >
                <EllipsisVertical size={16} className="shrink-0 stroke-[1.7]" />
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
                    } bg-paper ring-ink-08 z-20 w-40 rounded-xl p-1.5 shadow-2xl ring-1`}
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
                          className="text-ink hover:bg-ink-05 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                        >
                          Edit
                        </button>
                      </motion.div>
                      <motion.div variants={staggerItem}>
                        <button
                          onClick={(e) => handleAction(e, onViewOnStore)}
                          className="text-ink hover:bg-ink-05 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                        >
                          View on Store
                        </button>
                      </motion.div>
                      <motion.div variants={staggerItem}>
                        <button
                          onClick={handleToggleStatus}
                          className="text-ink hover:bg-ink-05 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                        >
                          {data.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <div className="bg-ink-08 my-1 h-px" />
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-rust hover:bg-rust/10 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
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
            className="bg-ink-55 fixed inset-0 z-100 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-paper shadow-card relative w-full max-w-md rounded-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-ink text-xl font-bold">
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

              <div className="mb-6 flex gap-4">
                <img
                  src={displayImages[0]}
                  alt={data.title}
                  className="h-20 w-20 rounded-sm object-cover shadow-sm"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-ink-55 mb-1 text-sm">
                    Are you sure you want to delete this{" "}
                    {variant === "admin-category" ? "category" : "product"}?
                  </p>
                  <p className="text-ink line-clamp-2 font-semibold">
                    {data.title}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-ink-55 mb-2 block text-sm">
                  Type{" "}
                  <span className="text-ink font-bold select-none">
                    {data.title}
                  </span>{" "}
                  to confirm.
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={data.title}
                  className="border-ink-25 text-ink focus:border-ink w-full rounded-sm border px-3 py-2 transition-colors outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(false);
                    setDeleteInput("");
                  }}
                  className="text-ink border-ink-25 hover:bg-ink-05 rounded-sm border px-4 py-2 transition-colors"
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
                  className="bg-rust text-paper rounded-sm px-4 py-2 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
