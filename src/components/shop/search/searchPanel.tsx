"use client";

import { Clock, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearch } from "./useSearch";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { categories } from "@/lib/db/schema";
import Image from "next/image";
import { createPortal } from "react-dom";

type Category = typeof categories.$inferSelect;

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function SearchPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { recentSearches, removeRecent, submit, query, setQuery } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setCategoriesError(false);
        const res = await fetch("/api/categories");
        if (!res.ok) {
          setCategoriesError(true);
          return;
        }
        const result = await res.json();
        if (!result.success) {
          setCategoriesError(true);
          return;
        }
        const list = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result.data?.categories ?? []);
        setCategories(list);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategoriesError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            if (isOpen) inputRef.current?.focus();
          }}
          className="bg-opacity-50 fixed inset-0 z-50 flex flex-1 flex-col bg-black/20 drop-shadow-2xl backdrop-blur-lg"
          onClick={onClose}
        >
          <div
            className="bg-paper no-scrollbar flex h-full w-full flex-col gap-10 overflow-y-auto px-7 py-6 md:h-[60%] md:px-[15vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-ink flex items-center justify-between gap-6 border-b-2 py-2">
              <Search
                size={32}
                className="text-rose-gold cursor-pointer"
                onClick={() => {
                  submit();
                  onClose();
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submit();
                    onClose();
                  }
                }}
                placeholder="Search the atelier..."
                className="font-display placeholder-ink-25 btn-focus w-full py-2 text-2xl leading-5 font-bold md:text-4xl"
              />
              <div
                className="border-ink-25 group hover:bg-ink cursor-pointer rounded-full border-[0.5] p-2.5 transition-all duration-300 ease-in-out"
                onClick={onClose}
              >
                <X
                  size={18}
                  className="text-ink stroke-[1.7] transition-colors duration-300 ease-in-out group-hover:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-12 md:flex-row">
              <div className="flex flex-col gap-6 md:w-[50%]">
                <h5 className="font-label text-rose-gold text-sm font-semibold tracking-[2] uppercase">
                  Recent Searches
                </h5>
                <div className="flex flex-col gap-4 px-2">
                  {recentSearches.length > 0 ? (
                    recentSearches.map((item) => (
                      <div
                        key={item}
                        className="border-ink-25 group flex cursor-pointer items-center gap-3 border-b px-1 pb-2"
                        onClick={() => {
                          submit(item);
                          onClose();
                        }}
                      >
                        <Clock
                          size={14}
                          className="text-ink-40 group-hover:text-rose-gold"
                        />
                        <p className="text-ink group-hover:text-rose-gold flex-1 text-sm">
                          {item}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecent(item);
                          }}
                          className="text-ink-40 hover:text-rose-gold btn-focus text-xs"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-ink-40 text-sm">
                      You haven&apos;t searched for anything yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 md:w-[45%]">
                <h5 className="font-label text-rose-gold text-sm font-semibold tracking-[2] uppercase">
                  Explore by Occasion
                </h5>
                <div className="grid h-full grid-cols-2 gap-4">
                  {loading ? (
                    <p className="font-serif-alt text-ink-40 col-span-2 flex h-full items-center justify-center text-2xl">
                      Loading categories...
                    </p>
                  ) : categoriesError ? (
                    <p className="font-serif-alt text-ink-40 col-span-2 flex h-full items-center justify-center text-2xl font-bold">
                      Couldn&apos;t load categories
                    </p>
                  ) : categories.length === 0 ? (
                    <p className="font-serif-alt text-ink-40 col-span-2 flex h-full items-center justify-center text-2xl">
                      No categories to load
                    </p>
                  ) : (
                    categories.map((cat: Category, idx: number) => (
                      <div
                        key={cat.id || idx}
                        className="group relative aspect-5/3 w-full cursor-pointer overflow-hidden rounded"
                      >
                        <Image
                          src={cat.categoryImageUrl ?? ""}
                          alt={cat.title}
                          fill={true}
                          loading="lazy"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <h5 className="font-display absolute bottom-2 left-3 text-xl font-semibold tracking-wider text-white lowercase first-letter:uppercase">
                          {cat.title}
                        </h5>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
