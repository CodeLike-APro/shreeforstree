import { ClockIcon, SearchIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearch } from "./useSearch";
import { useEffect, useRef, useState } from "react";

export function SearchPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { recentSearches, removeRecent, submit, query, setQuery } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!mounted) return null;

  return (
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
          className="fixed inset-0 z-50 flex flex-col flex-1 backdrop-blur-lg bg-black/20 drop-shadow-2xl bg-opacity-50"
          onClick={onClose}
        >
          <div
            className="h-full md:h-[60%] w-full bg-paper py-6 px-7 md:px-[15vw] flex flex-col gap-10 overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-2 border-ink flex items-center justify-between gap-6 py-2">
              <SearchIcon
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
                className="py-2 leading-5 w-full font-display font-bold text-2xl md:text-4xl focus:outline-none focus:ring-0 placeholder-ink-25"
              />
              <div
                className="cursor-pointer border-[0.5] border-ink-25 rounded-full p-2.5 group hover:bg-ink transition-all duration-300 ease-in-out "
                onClick={onClose}
              >
                <XIcon
                  size={18}
                  className="text-ink stroke-[1.7] group-hover:text-white transition-colors duration-300 ease-in-out"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
              <div className="flex flex-col gap-6 md:w-[50%]">
                <h5 className="text-sm font-label font-semibold uppercase text-rose-gold tracking-[2]">
                  Recent Searches
                </h5>
                <div className="flex flex-col gap-4 px-2">
                  {recentSearches.length > 0 ? (
                    recentSearches.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 border-b border-ink-25 pb-2 px-1 group cursor-pointer"
                        onClick={() => {
                          submit(item);
                          onClose();
                        }}
                      >
                        <ClockIcon
                          size={14}
                          className="text-ink-40 group-hover:text-rose-gold"
                        />
                        <p className="text-ink text-sm group-hover:text-rose-gold flex-1">
                          {item}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecent(item);
                          }}
                          className="text-ink-40 hover:text-rose-gold text-xs"
                        >
                          <XIcon size={13} />
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
                <h5 className="text-sm font-label font-semibold uppercase text-rose-gold tracking-[2]">
                  Explore by Occasion
                </h5>
                <div className="grid grid-cols-2 gap-4 h-full">
                  {loading ? (
                    <p className="text-2xl font-serif-alt text-ink-40 col-span-2 flex justify-center items-center h-full">
                      Loading categories...
                    </p>
                  ) : categoriesError ? (
                    <p className="text-2xl font-bold font-serif-alt text-ink-40 col-span-2 flex justify-center items-center h-full">
                      Couldn&apos;t load categories
                    </p>
                  ) : categories.length === 0 ? (
                    <p className="text-2xl font-serif-alt text-ink-40 col-span-2 flex justify-center items-center h-full">
                      No categories to load
                    </p>
                  ) : (
                    categories.map((cat: any, idx: number) => (
                      <div
                        key={cat.id || idx}
                        className="relative aspect-5/3 w-full overflow-hidden rounded cursor-pointer group"
                      >
                        <img
                          src={cat.categoryImageUrl}
                          alt={cat.name || cat.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <h5 className="absolute bottom-2 left-3 text-xl font-display font-semibold text-white lowercase first-letter:uppercase tracking-wider">
                          {cat.name || cat.title}
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
    </AnimatePresence>
  );
}
