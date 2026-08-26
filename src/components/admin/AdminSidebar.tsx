"use client";
import { authClient } from "@/lib/auth-client";
import {
  Box,
  LayoutDashboard,
  LayoutGrid,
  PanelLeft,
  Settings2,
  Shirt,
  User,
  Users,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import UserDropdown from "@/utils/Dropdown";

const EXPANDED_WIDTH = "14rem";
const COLLAPSED_WIDTH = "4.2rem";

const sideBarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Shirt, label: "Products", href: "/admin/products" },
  { icon: LayoutGrid, label: "Categories", href: "/admin/categories" },
  { icon: Box, label: "Orders", href: "/admin/orders" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Settings2, label: "Settings", href: "/admin/settings" },
];

const USER_MENU_ITEMS = [
  { label: "My Profile", href: "/account", icon: <User /> },
];

/* ── spring config shared by the sidebar width + content fades ── */
const sidebarSpring = {
  type: "spring" as const,
  damping: 28,
  stiffness: 260,
  mass: 0.9,
};

const labelFade: Variants = {
  show: {
    opacity: 1,
    x: 0,
    display: "block",
    transition: { duration: 0.2, delay: 0.08 },
  },
  hide: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.15 },
    transitionEnd: { display: "none" },
  },
};

export default function AdminSideBar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const { isCollapsed, toggle } = useSidebarStore();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userTriggerRef = useRef<HTMLButtonElement>(null);

  /* close dropdown when sidebar collapses */
  useEffect(() => {
    if (isCollapsed) setIsUserDropdownOpen(false);
  }, [isCollapsed]);

  const initial = (
    session?.user?.name?.trim()?.[0] ||
    session?.user?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <motion.div
      animate={{
        width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        maxWidth: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        minWidth: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
      }}
      transition={sidebarSpring}
      className="bg-ink text-blush sticky top-0 z-40 flex h-screen shrink-0 flex-col items-center justify-center gap-6 px-3 py-4 select-none"
    >
      {/* ─── Top section: toggle + brand + nav links ─── */}
      <div className="flex h-full w-full flex-col items-start justify-start gap-10">
        {/* Toggle + branding */}
        <div className="flex items-center justify-start gap-2">
          <button
            onClick={toggle}
            className="hover:bg-blush/10 group relative shrink-0 cursor-pointer rounded-md p-3"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <PanelLeft size={19} />
            </motion.div>
            <div
              className={`absolute top-1/2 left-full ml-4 -translate-y-1/2 px-2.5 py-1 ${isCollapsed ? "bg-ink text-paper" : "bg-paper text-ink"} pointer-events-none z-50 rounded-sm text-xs font-bold whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-hover:delay-500`}
            >
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </div>
          </button>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <Link
                  href="/"
                  className="hover:bg-blush/20 flex cursor-pointer flex-col items-start gap-0.5 rounded-md px-3 py-0 transition-colors duration-200"
                >
                  <h1 className="text-paper text-xl leading-tight font-extrabold">
                    shreeforstree
                  </h1>
                  <p className="text-rose-gold text-[0.7rem] font-bold tracking-widest uppercase">
                    Admin panel
                  </p>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation links */}
        <div className="text-blush/70 flex w-full flex-col gap-1">
          {sideBarLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                href={link.href}
                key={index}
                className="group relative block"
                aria-label={link.label}
              >
                {/* Active Indicator Strip / Collapsed Background */}
                {isActive && (
                  <motion.div
                    layout
                    layoutId="active-nav-indicator"
                    className={`bg-rose-gold absolute left-0 z-0 ${
                      isCollapsed
                        ? "inset-0 rounded-md"
                        : "inset-y-0 w-1 rounded-r-md"
                    }`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Expanded active highlight & Hover background */}
                <div
                  className={`absolute inset-0 z-0 rounded-md transition-colors duration-300 ${
                    isActive && !isCollapsed ? "bg-blush/30" : ""
                  } ${!isActive ? "group-hover:bg-blush/10" : ""}`}
                />

                <div
                  className={`relative z-10 flex h-12 cursor-pointer items-center gap-4 rounded-md px-3 py-3 transition-transform duration-300 ${
                    isActive ? "text-paper" : ""
                  } ${isActive && !isCollapsed ? "translate-x-1.5" : "translate-x-0"}`}
                >
                  <div className="w-4.75 shrink-0 stroke-[1.7]">
                    <Icon size={19} />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.p
                        variants={labelFade}
                        initial="hide"
                        animate="show"
                        exit="hide"
                        className="text-sm font-bold tracking-wide whitespace-nowrap"
                      >
                        {link.label}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {isCollapsed && (
                  <div className="bg-ink text-paper pointer-events-none absolute top-1/2 left-full z-50 ml-4 -translate-y-1/2 rounded-sm px-2.5 py-1 text-xs font-bold whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-hover:delay-500">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom section: divider + dropdown + profile ─── */}
      <div className="relative flex w-full flex-col items-center justify-center gap-1 transition-colors duration-200">
        <div className="bg-blush/30 mb-2 h-[0.7px] w-full"></div>

        <UserDropdown
          isOpen={isUserDropdownOpen}
          onClose={() => setIsUserDropdownOpen(false)}
          triggerRef={userTriggerRef}
          items={USER_MENU_ITEMS}
          direction="up"
          variant="minimal"
        />

        {/* Profile trigger */}
        <button
          ref={userTriggerRef}
          onClick={() => setIsUserDropdownOpen((prev) => !prev)}
          className="hover:bg-blush/10 group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-0.5 py-1.5 transition-colors duration-200"
          aria-label="Profile"
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "avatar"}
              className="ring-blush h-10 w-10 shrink-0 rounded-full object-cover ring-1"
            />
          ) : (
            <span className="bg-rose-gold font-display text-paper flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold">
              {initial}
            </span>
          )}

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden whitespace-nowrap"
              >
                {session?.user?.name && (
                  <p className="font-body text-paper truncate text-sm font-semibold">
                    {session.user.name}
                  </p>
                )}
                {/*TODO: Make this a dynamic role based on the user role from the
                session object */}
                <p className="font-body text-blush/70 truncate text-xs">
                  Store admin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {isCollapsed && (
            <div className="bg-ink text-paper pointer-events-none absolute top-1/2 left-full z-50 ml-4 -translate-y-1/2 rounded-sm px-2.5 py-1 text-xs font-bold whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-hover:delay-500">
              {session?.user?.name || "Profile"}
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
