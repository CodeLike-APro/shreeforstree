"use client";
import Link from "next/link";
import { HandbagIcon, HeartIcon, SearchIcon, UserIcon } from "lucide-react";
import { useSearch } from "./search/useSearch";
import { SearchPanel } from "./search/searchPanel";

export default function HeaderDesktop() {
  const navLinks = [
    { label: "SHOP", href: "/shop" },
    { label: "COLLECTIONS", href: "/collections" },
    { label: "OUR STORY", href: "/our-story" },
    { label: "CONTACT", href: "/contact" },
  ];
  // Header.tsx
  const { isOpen, open, close } = useSearch();

  return (
    <header className="flex items-center justify-between border-b border-border py-4 px-4 h-17 w-full">
      <nav className="flex items-center gap-4 w-full">
        <Link
          href="/"
          className="text-2xl font-display font-bold text-ink tracking-[2] h-35px w-186px text-[26px] mx-6 leading-none"
        >
          shreeforstree
        </Link>
        <div className="w-full flex items-center justify-between gap-7">
          <div className="flex items-center gap-7 pt-2.5">
            {navLinks.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-lg font-label font-semibold uppercase text-ink tracking-[1.75] h-11.5px w-37px text-[12.5px] leading-2.5  "
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mr-6">
            <div className="flex items-center justify-end gap-3">
              <SearchIcon
                onClick={open}
                className="cursor-pointer stroke-[1.4]"
              />

              <SearchPanel isOpen={isOpen} onClose={close} />
            </div>
            <div>
              <HeartIcon className="cursor-pointer stroke-[1.4]" />
            </div>
            <div>
              <HandbagIcon className="cursor-pointer stroke-[1.4]" />
            </div>
            <div>
              <UserIcon className="cursor-pointer stroke-[1.4]" />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
