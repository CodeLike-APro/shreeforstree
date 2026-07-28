"use client";

import { EllipsisVertical, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "motion/react";

export type CardVariant =
  | "customer-product"
  | "admin-product"
  | "admin-category";

export interface CardData {
  id: string;
  title: string;
  image: string;
  price?: number;
  discountedPrice?: number;
  tags?: { label: string; type: "new" | "hero" | string }[];
  isActive?: boolean;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isAdmin = variant === "admin-product" || variant === "admin-category";
  const showTags = variant === "admin-product";
  const showPrices =
    variant === "customer-product" || variant === "admin-product";
  const isInactive = data.isActive === false;

  return (
    <div className="select-none shrink-0">
      <div
        className="w-64 rounded-sm cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="w-full relative">
          <div>
            <img
              src={data.image || "/images/white.webp"}
              alt={data.title}
              loading="lazy"
              className={`w-64 aspect-3/4 object-cover rounded-sm transition-opacity duration-300 ${isInactive && isAdmin ? "opacity-70" : "opacity-100"}`}
            />
          </div>

          {showTags && data.tags && data.tags.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-2 items-start">
              {data.tags.map((tag, index) => (
                <div
                  key={index}
                  className={`bg-${tag.type === "hero" ? "ink text-paper" : "paper text-rose-gold"} text-[0.6rem] font-bold py-1 px-2 uppercase tracking-widest`}
                >
                  {tag.label}
                </div>
              ))}
            </div>
          )}

          {isAdmin && isInactive && (
            <div className="flex items-center justify-center gap-2 absolute top-2 right-2 bg-paper text-rust text-[0.6rem] font-bold py-1 px-2 uppercase tracking-widest rounded-full">
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
                {data.discountedPrice &&
                data.discountedPrice < (data.price || 0) ? (
                  <>
                    <p className="text-md text-rose-gold tracking-wide">
                      {formatPrice(data.discountedPrice)}
                    </p>
                    <p className="text-xs text-ink-40 line-through">
                      {formatPrice(data.price || 0)}
                    </p>
                  </>
                ) : (
                  <p className="text-md text-rose-gold tracking-wide">
                    {formatPrice(data.price || 0)}
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
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={`absolute top-8 ${
                      dropdownSide === "right"
                        ? "left-0 origin-top-left"
                        : "right-0 origin-top-right"
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
                  src={data.image || "/images/white.webp"}
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
