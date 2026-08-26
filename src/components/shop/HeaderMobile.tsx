// /components/shop/HeaderMobile.tsx
"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { User, Package, Heart, MapPin } from "lucide-react";
import UserDropdown from "../../utils/Dropdown";
const USER_MENU_ITEMS = [
  { label: "My Profile", href: "/account", icon: <User /> },
  { label: "My Orders", href: "/orders", icon: <Package /> },
  { label: "Wishlist", href: "/wishlist", icon: <Heart /> },
  { label: "Addresses", href: "/account/addresses", icon: <MapPin /> },
] as const;

export default function HeaderMobile() {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="fixed flex h-16 w-full items-center justify-between bg-linear-to-b from-black/20 to-transparent px-4 py-2 md:hidden">
        <div className="px-1">
          <Link href="/" className="font-display text-ink text-4xl">
            shreeforstree
          </Link>
        </div>
        <button
          ref={userTriggerRef}
          onClick={() => setIsUserDropdownOpen((prev) => !prev)}
          aria-label="Account menu"
          className="bg-paper text-ink rounded-full p-2"
        >
          <User />
        </button>
      </div>
      <UserDropdown
        isOpen={isUserDropdownOpen}
        onClose={() => setIsUserDropdownOpen(false)}
        triggerRef={userTriggerRef}
        items={USER_MENU_ITEMS}
      />
    </>
  );
}
