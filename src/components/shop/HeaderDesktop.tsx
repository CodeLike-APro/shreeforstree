"use client";
import Link from "next/link";
import { User, Package, Heart, MapPin, Search, Handbag } from "lucide-react";
import { useSearch } from "./search/useSearch";
import { SearchPanel } from "./search/searchPanel";
import UserDropdown from "../../utils/Dropdown";
import { useRef, useState } from "react";

const USER_MENU_ITEMS = [
  { label: "My Profile", href: "/account", icon: <User /> },
  { label: "My Orders", href: "/orders", icon: <Package /> },
  { label: "Wishlist", href: "/wishlist", icon: <Heart /> },
  { label: "Addresses", href: "/account/addresses", icon: <MapPin /> },
] as const;

export default function HeaderDesktop() {
  const navLinks = [
    { label: "SHOP", href: "/shop" },
    { label: "COLLECTIONS", href: "/collections" },
    { label: "OUR STORY", href: "/our-story" },
    { label: "CONTACT", href: "/contact" },
  ];
  // Header.tsx
  const { isOpen, open, close } = useSearch();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userTriggerRef = useRef<HTMLDivElement>(null);

  return (
    <header className="border-border flex h-22 w-full items-center justify-between border-b px-4 py-4">
      <nav className="flex w-full items-center gap-4">
        <Link
          href="/"
          className="font-display text-ink h-35px w-186px mx-6 text-2xl text-[26px] leading-none font-bold tracking-[2]"
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
                  className="font-label text-ink h-11.5px w-37px text-lg text-[12.5px] leading-2.5 font-semibold tracking-[1.75] uppercase"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mr-6 flex items-center gap-6">
            <div className="flex items-center justify-end gap-3">
              <Search onClick={open} className="cursor-pointer stroke-[1.4]" />

              <SearchPanel isOpen={isOpen} onClose={close} />
            </div>
            <div>
              <Link href="/wishlist">
                <Heart className="cursor-pointer stroke-[1.4]" />
              </Link>
            </div>
            <div>
              <Link href="/cart">
                <Handbag className="cursor-pointer stroke-[1.4]" />
              </Link>
            </div>
            <div ref={userTriggerRef} className="relative">
              <User
                className="cursor-pointer stroke-[1.4]"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
              />
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                triggerRef={userTriggerRef}
                items={USER_MENU_ITEMS}
              />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
