// /components/shop/HeaderMobile.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { UserIcon } from "lucide-react";

export default function HeaderMobile() {
  return (
    <div className="flex md:hidden h-16 w-full items-center justify-between bg-linear-to-b from-black/20 to-transparent px-4 py-2 fixed">
      <div className="px-1">
        <Link href="/" className="text-4xl font-display text-ink">
          shreeforstree
        </Link>
      </div>
      <button className="rounded-full bg-paper p-2 text-ink">
        <UserIcon />
      </button>
    </div>
  );
}
