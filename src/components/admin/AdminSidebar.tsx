"use client";
import { authClient } from "@/lib/auth-client";
import {
  Bell,
  Box,
  LayoutDashboard,
  LayoutGrid,
  PanelLeft,
  Settings2,
  Shirt,
  UserIcon,
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
  { label: "My Profile", href: "/account", icon: <UserIcon /> },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell /> },
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
      className="flex flex-col justify-center items-center gap-6 h-screen sticky top-0 shrink-0 bg-ink px-3 py-4 text-blush select-none z-40"
    >
      {/* ─── Top section: toggle + brand + nav links ─── */}
      <div className="flex flex-col gap-10 items-start justify-start w-full h-full">
        {/* Toggle + branding */}
        <div className="flex items-center justify-start gap-2">
          <button
            onClick={toggle}
            className="hover:bg-blush/10 p-3 rounded-md cursor-pointer shrink-0 relative group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <PanelLeft size={19} />
            </motion.div>
            <div
              className={`absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1 ${isCollapsed ? "bg-ink text-paper" : "bg-paper text-ink"} text-xs font-bold rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 group-hover:delay-500 whitespace-nowrap shadow-md z-50`}
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
                  className="cursor-pointer flex flex-col items-start gap-0.5 hover:bg-blush/20 px-3 py-0 rounded-md transition-colors duration-200"
                >
                  <h1 className="text-xl font-extrabold text-paper leading-tight">
                    shreeforstree
                  </h1>
                  <p className="uppercase text-rose-gold text-[0.7rem] font-bold tracking-widest">
                    Admin panel
                  </p>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation links */}
        <div className="flex flex-col text-blush/70 gap-1 w-full">
          {sideBarLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                href={link.href}
                key={index}
                className="relative group block"
                aria-label={link.label}
              >
                {/* Active Indicator Strip / Collapsed Background */}
                {isActive && (
                  <motion.div
                    layout
                    layoutId="active-nav-indicator"
                    className={`absolute left-0 z-0 bg-rose-gold ${
                      isCollapsed
                        ? "inset-0 rounded-md"
                        : "inset-y-0 w-1 rounded-r-md"
                    }`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Expanded active highlight & Hover background */}
                <div
                  className={`absolute inset-0 rounded-md transition-colors duration-300 z-0 ${
                    isActive && !isCollapsed ? "bg-blush/30" : ""
                  } ${!isActive ? "group-hover:bg-blush/10" : ""}`}
                />

                <div
                  className={`flex h-12 items-center gap-4 py-3 rounded-md cursor-pointer px-3 relative z-10 transition-transform duration-300 ${
                    isActive ? "text-paper" : ""
                  } ${isActive && !isCollapsed ? "translate-x-1.5" : "translate-x-0"}`}
                >
                  <div className="stroke-[1.7] shrink-0 w-4.75">
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
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1 bg-ink text-paper text-xs font-bold rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 group-hover:delay-500 whitespace-nowrap shadow-md z-50">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom section: divider + dropdown + profile ─── */}
      <div className="w-full flex flex-col items-center justify-center gap-1 transition-colors duration-200 relative">
        <div className="h-[0.7px] w-full bg-blush/30 mb-2"></div>

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
          className="flex items-center gap-3 rounded-xl hover:bg-blush/10 transition-colors duration-200 w-full px-0.5 py-1.5 cursor-pointer relative group"
          aria-label="Profile"
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "avatar"}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-blush"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-gold font-display text-lg font-bold text-paper">
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
                  <p className="truncate font-body text-sm font-semibold text-paper">
                    {session.user.name}
                  </p>
                )}
                {/*TODO: Make this a dynamic role based on the user role from the
                session object */}
                <p className="truncate font-body text-xs text-blush/70">
                  Store admin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1 bg-ink text-paper text-xs font-bold rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 group-hover:delay-500 whitespace-nowrap shadow-md z-50">
              {session?.user?.name || "Profile"}
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
