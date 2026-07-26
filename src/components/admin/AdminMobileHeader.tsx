// /components/shop/HeaderMobile.tsx
"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { UserIcon, Bell } from "lucide-react";
import UserDropdown from "../../utils/Dropdown";
const USER_MENU_ITEMS = [
  { label: "My Profile", href: "/account", icon: <UserIcon /> },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell /> },
] as const;

export default function HeaderMobile() {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="flex md:hidden h-16 w-full items-center justify-between bg-linear-to-b from-black/20 to-transparent px-4 py-2 fixed">
        <div className="px-1">
          <Link href="/" className="text-4xl font-display text-ink">
            shreeforstree
          </Link>
        </div>
        <button
          ref={userTriggerRef}
          onClick={() => setIsUserDropdownOpen((prev) => !prev)}
          aria-label="Account menu"
          className="rounded-full bg-paper p-2 text-ink"
        >
          <UserIcon />
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
