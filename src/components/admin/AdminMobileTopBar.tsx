"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Plus, Search, SlidersHorizontal, UserIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import UserDropdown from "../../utils/Dropdown";
import { motion, AnimatePresence } from "motion/react";

const USER_MENU_ITEMS = [
  { label: "My Profile", href: "/account", icon: <UserIcon /> },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell /> },
] as const;

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
    submitLabel: "Create",
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

export default function AdminMobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userTriggerRef = useRef<HTMLButtonElement>(null);

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

  const isFormSubPage =
    /^\/admin\/categories\/[^/]+$/.test(pathname) ||
    /^\/admin\/products\/[^/]+$/.test(pathname);

  if (isFormSubPage) return null;

  return (
    <div className="px-4 py-3 sticky top-0 z-50 w-full flex flex-col gap-3 bg-paper border-b border-ink-25 select-none">
      {/* Row 1: Title, Description, Buttons */}
      <div className="flex items-center justify-between w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-start justify-center"
          >
            <h1 className="font-display font-bold text-ink text-3xl leading-tight">
              {currentItem.title}
            </h1>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-end gap-2">
          <div className="bg-paper border border-ink-40 rounded-lg flex items-center justify-center p-3 cursor-pointer shrink-0">
            <Bell size={18} className="text-ink" />
          </div>
          <button
            ref={userTriggerRef}
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
            aria-label="Account menu"
            className="rounded-lg bg-paper p-3 text-ink border border-ink-40 shrink-0"
          >
            <UserIcon size={18} />
          </button>
        </div>
      </div>

      {/* Row 2: Search Bar & Filters */}
      <AnimatePresence mode="popLayout">
        {(currentItem.search || currentItem.filters || currentItem.button || currentItem.cancelButton || currentItem.submitButton) && (
          <motion.div
            key="row2"
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-2 w-full overflow-hidden"
          >
            <AnimatePresence mode="popLayout">
              {currentItem.search && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  key="search"
                  className="flex w-full h-10 items-center justify-center border border-ink-40 focus-within:border-ink rounded-lg px-1.5 gap-3 transition-all duration-300"
                >
                  <div className="flex items-center h-full text-ink/60 border-r border-ink-40 pr-2">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={currentItem.searchPlaceholder || "Search..."}
                    className="bg-paper h-full w-full py-1.5 focus:outline-none"
                  />
                </motion.div>
              )}
              {(currentItem.filters || currentItem.button || currentItem.cancelButton || currentItem.submitButton) && (
                <motion.div layout className="flex items-center gap-2 shrink-0">
                  <AnimatePresence mode="popLayout">
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
                          className="bg-paper border border-ink-40 hover:border-ink hover:bg-ink transition-all duration-300 rounded-lg flex items-center justify-center px-4 h-9.5 shrink-0"
                        >
                          <div className="text-sm font-body text-ink font-bold group-hover:text-white transition-colors duration-300">
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
                          className="bg-rose-gold hover:bg-rose-gold-dark transition-all duration-300 rounded-lg flex items-center justify-center px-4 h-9.5 shrink-0"
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
                        className="bg-paper border border-ink-40 rounded-lg flex items-center justify-center w-9.5 h-9.5 cursor-pointer shrink-0"
                      >
                        <SlidersHorizontal size={18} className="text-ink" />
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
                          className="bg-rose-gold rounded-lg flex items-center justify-center h-9.5 w-9.5 shrink-0"
                        >
                          <Plus size={18} className="text-paper" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <UserDropdown
        isOpen={isUserDropdownOpen}
        onClose={() => setIsUserDropdownOpen(false)}
        triggerRef={userTriggerRef}
        items={USER_MENU_ITEMS}
      />
    </div>
  );
}
