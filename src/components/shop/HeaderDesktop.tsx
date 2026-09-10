"use client";
import Link from "next/link";
import { User, Package, Heart, MapPin, Search, Handbag } from "lucide-react";
import { useSearchPanel } from "./search/useSearch";
import UserDropdown from "../../utils/Dropdown";
import { useRef, useState } from "react";
import { SearchPanel } from "./search/searchPanel";
import Cart from "./Cart";

const USER_MENU_ITEMS = [
  { label: "My Profile", href: "/account", icon: <User /> },
  { label: "My Orders", href: "/orders", icon: <Package /> },
  { label: "Wishlist", href: "/wishlist", icon: <Heart /> },
  { label: "Addresses", href: "/account/addresses", icon: <MapPin /> },
] as const;

type AdminPath = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export default function HeaderDesktop({
  adminPath,
}: {
  adminPath?: AdminPath;
}) {
  const navLinks = [
    { label: "SHOP", href: "/shop" },
    { label: "COLLECTIONS", href: "/collections" },
    { label: "OUR STORY", href: "/our-story" },
    { label: "CONTACT", href: "/contact" },
  ];
  // Header.tsx
  const { isOpen, open, close } = useSearchPanel();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userTriggerRef = useRef<HTMLDivElement>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const userMenuItems = [
    ...USER_MENU_ITEMS.map((item) => ({
      label: item.label,
      href: item.href,
      icon: item.icon,
    })),
    ...(adminPath ? [adminPath] : []),
  ];

  return (
    <header className="border-border flex h-22 w-full items-center justify-between border-b px-4 py-4">
      <nav className="flex w-full items-center gap-4">
        <Link
          href="/"
          className="font-display btn-focus text-ink h-35px w-186px mx-6 rounded-lg px-2 py-1 text-2xl text-[26px] leading-none font-bold tracking-[2]"
        >
          shreeforstree
        </Link>
        <div className="flex w-full items-center justify-between gap-7">
          <div className="flex items-center gap-7 pt-2.5">
            {navLinks.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-label btn-focus text-ink h-11.5px w-37px rounded-md pt-2 pr-1 pb-1 pl-1.5 text-lg text-[12.5px] leading-2.5 font-semibold tracking-[1.75] uppercase"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mr-6 flex items-center gap-6">
            <div className="flex items-center justify-end gap-3">
              <button
                className="btn-focus rounded-md p-0.5"
                onClick={open}
                aria-label="Search"
              >
                <Search className="cursor-pointer stroke-[1.4]" />
              </button>

              <SearchPanel isOpen={isOpen} onClose={close} />
            </div>
            <div className="flex items-center justify-center">
              <Link href="/wishlist" className="btn-focus rounded-md p-0.5">
                <Heart className="cursor-pointer stroke-[1.4]" />
              </Link>
            </div>
            <div>
              <button
                className="btn-focus mt-[6] rounded-md p-0.5"
                onClick={() => {
                  setIsCartOpen(true);
                }}
                aria-label="Cart"
              >
                <Handbag className="cursor-pointer stroke-[1.4]" />
              </button>
            </div>
            <div ref={userTriggerRef} className="relative">
              <button
                className="btn-focus mt-[6] rounded-md p-0.5"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
              >
                <User className="cursor-pointer stroke-[1.4]" />
              </button>
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                triggerRef={userTriggerRef}
                items={userMenuItems}
              />
            </div>
          </div>
        </div>
      </nav>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
