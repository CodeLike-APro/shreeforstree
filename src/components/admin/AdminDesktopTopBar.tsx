"use client";

import { Bell, Plus, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

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
    buttonHref: "/admin/products/post",
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

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
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
  }, [searchValue, pathname, router, searchParams]);

  const currentItem =
    TOP_BAR_ITEMS.find((item) => pathname.startsWith(item.href)) ||
    TOP_BAR_ITEMS[0];

  const isCategorySubPage = /^\/admin\/categories\/[^/]+$/.test(pathname);

  if (isCategorySubPage) return null;

  return (
    <div className="px-6 py-3 sticky top-0 z-50 w-full flex items-center justify-center gap-4 bg-paper border-b border-ink-25 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-start justify-center"
        >
          <h1 className="font-display font-bold text-ink text-3xl leading-tight">
            {currentItem.title}
          </h1>
          <p className="font-body text-ink-40 text-xs tracking-wide">
            {currentItem.description}
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center justify-around gap-2 ml-auto">
        <AnimatePresence mode="popLayout">
          {currentItem.search && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              key="search"
              className="flex w-60 items-center justify-center border border-ink-40 focus-within:border-ink rounded-lg px-1.5 gap-3 transition-all duration-300"
            >
              <div className="flex items-center justify-center text-ink/60 border-r border-ink-40 pr-2 h-full">
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
                className="bg-rose-gold hover:bg-rose-gold-dark transition-all duration-300 rounded-lg flex items-center justify-around group px-1"
              >
                <div className="flex items-center justify-center text-paper p-1 py-1.5 group-hover:text-white transition-colors duration-300">
                  <Plus size={18} />
                </div>
                <div className="text-xs font-body text-paper font-bold p-1 py-3 group-hover:text-white transition-colors duration-300">
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
                className="bg-paper border border-ink-40 hover:border-ink hover:bg-ink transition-all duration-300 rounded-lg flex items-center justify-center px-4 py-2 group"
              >
                <div className="text-sm font-body text-ink font-bold group-hover:text-paper transition-colors duration-300">
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
                className="bg-rose-gold hover:bg-rose-gold-dark transition-all duration-300 rounded-lg flex items-center justify-center px-4 py-2"
              >
                <div className="text-sm font-body text-paper font-bold group-hover:text-white transition-colors duration-300">
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
              className="bg-paper border border-ink-40 hover:border-ink hover:bg-ink transition-all duration-300 rounded-lg flex items-center justify-around group"
            >
              <div className="flex items-center justify-center text-ink pl-2 pr-1 py-1.5 group-hover:text-white transition-colors duration-300">
                <SlidersHorizontal size={18} />
              </div>
              <div className="text-xs font-body text-ink font-bold pl-1 pr-2 py-3 group-hover:text-white transition-colors duration-300">
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
              className="bg-paper border border-ink-40 hover:border-ink hover:bg-ink transition-all duration-300 rounded-lg flex items-center justify-around group p-3"
            >
              <div className="flex items-center justify-center text-ink group-hover:text-white transition-colors duration-300">
                <Bell size={18} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
