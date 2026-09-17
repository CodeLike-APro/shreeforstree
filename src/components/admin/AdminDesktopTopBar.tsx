"use client";

import { Bell, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TOP_BAR_ITEMS = [
  {
    href: "/admin/dashboard",
    title: "Dashboard",
    description: "Overview of your store",
    search: false,
    button: false,
    filters: false,
    bell: true,
  },
  {
    href: "/admin/products",
    title: "Products",
    description: "Your made-to-order catalogue",
    search: true,
    searchPlaceholder: "Search products...",
    button: true,
    buttonLabel: "New Product",
    buttonHref: "/admin/products/new",
    filters: true,
    bell: false,
  },
  {
    href: "/admin/categories/post",
    title: "New category",
    description: "Add a collection to your store",
    search: false,
    button: false,
    filters: false,
    bell: false,
    cancelButton: true,
    cancelHref: "/admin/categories",
    submitButton: true,
    submitLabel: "Create category",
    submitFormId: "category-post-form",
  },
  {
    href: "/admin/categories",
    title: "Categories",
    description: "Organize your collections",
    search: true,
    searchPlaceholder: "Search categories...",
    button: true,
    buttonLabel: "New Category",
    buttonHref: "/admin/categories/post",
    filters: true,
    bell: false,
  },
  {
    href: "/admin/orders",
    title: "Orders",
    description: "Manage your orders",
    search: true,
    searchPlaceholder: "Search orders...",
    button: false,
    buttonLabel: "",
    filters: true,
    bell: false,
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "Your Users",
    search: true,
    searchPlaceholder: "Search users...",
    button: false,
    buttonLabel: "",
    filters: true,
    bell: false,
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Store configuration",
    search: false,
    searchPlaceholder: "",
    button: false,
    buttonLabel: "",
    filters: false,
    bell: false,
  },
];

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || "",
  );

  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentParams = searchParamsRef.current;
      const params = new URLSearchParams(currentParams.toString());
      const currentSearch = params.get("search") || "";

      if (searchValue !== currentSearch) {
        if (searchValue) {
          params.set("search", searchValue);
        } else {
          params.delete("search");
        }
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, pathname, router]);

  const currentItem =
    TOP_BAR_ITEMS.find((item) => pathname.startsWith(item.href)) ||
    TOP_BAR_ITEMS[0];

  const isFormSubPage =
    /^\/admin\/categories\/[^/]+$/.test(pathname) ||
    /^\/admin\/products\/[^/]+$/.test(pathname);

  if (isFormSubPage) return null;

  return (
    <div className="bg-paper border-ink-25 sticky top-0 z-50 flex w-full items-center justify-center gap-4 border-b px-6 py-3 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-start justify-center"
        >
          <h1 className="font-display text-ink text-3xl leading-tight font-bold">
            {currentItem.title}
          </h1>
          <p className="font-body text-ink-40 text-xs tracking-wide">
            {currentItem.description}
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="ml-auto flex items-center justify-around gap-2">
        <AnimatePresence mode="popLayout">
          {currentItem.search && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="search"
              className="border-ink-40 focus-within:border-ink flex w-60 items-center justify-center gap-3 rounded-lg border px-1.5 transition-all duration-300"
            >
              <div className="text-ink/60 border-ink-40 flex h-full items-center justify-center border-r pr-2">
                <Search />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={currentItem.searchPlaceholder || "Search..."}
                className="bg-paper w-full py-1.5 focus:outline-none"
              />
            </motion.div>
          )}
          {currentItem.button && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="button"
            >
              <button
                onClick={() => {
                  if (currentItem.buttonHref) {
                    router.push(currentItem.buttonHref);
                  }
                }}
                className="bg-rose-gold hover:bg-rose-gold-dark group flex items-center justify-around rounded-lg px-1 transition-all duration-300"
              >
                <div className="text-paper flex items-center justify-center p-1 py-1.5 transition-colors duration-300 group-hover:text-white">
                  <Plus size={18} />
                </div>
                <div className="font-body text-paper p-1 py-3 text-xs font-bold transition-colors duration-300 group-hover:text-white">
                  {currentItem.buttonLabel}
                </div>
              </button>
            </motion.div>
          )}
          {currentItem.cancelButton && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="cancel"
            >
              <button
                onClick={() => {
                  if (currentItem.cancelHref) {
                    router.push(currentItem.cancelHref);
                  }
                }}
                className="bg-paper border-ink-40 hover:border-ink hover:bg-ink group flex items-center justify-center rounded-lg border px-4 py-2 transition-all duration-300"
              >
                <div className="font-body text-ink group-hover:text-paper text-sm font-bold transition-colors duration-300">
                  Cancel
                </div>
              </button>
            </motion.div>
          )}
          {currentItem.submitButton && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="submit"
            >
              <button
                type="submit"
                form={currentItem.submitFormId}
                className="bg-rose-gold hover:bg-rose-gold-dark flex items-center justify-center rounded-lg px-4 py-2 transition-all duration-300"
              >
                <div className="font-body text-paper text-sm font-bold transition-colors duration-300 group-hover:text-white">
                  {currentItem.submitLabel}
                </div>
              </button>
            </motion.div>
          )}
          {currentItem.filters && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="filters"
              className="bg-paper border-ink-40 hover:border-ink hover:bg-ink group flex items-center justify-around rounded-lg border transition-all duration-300"
            >
              <div className="text-ink flex items-center justify-center py-1.5 pr-1 pl-2 transition-colors duration-300 group-hover:text-white">
                <SlidersHorizontal size={18} />
              </div>
              <div className="font-body text-ink py-3 pr-2 pl-1 text-xs font-bold transition-colors duration-300 group-hover:text-white">
                Filters
              </div>
            </motion.div>
          )}
          {currentItem.bell && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="bell"
              className="bg-paper border-ink-40 hover:border-ink hover:bg-ink group flex items-center justify-around rounded-lg border p-3 transition-all duration-300"
            >
              <div className="text-ink flex items-center justify-center transition-colors duration-300 group-hover:text-white">
                <Bell size={18} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
