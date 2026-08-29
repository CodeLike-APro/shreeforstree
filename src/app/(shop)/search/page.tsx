"use client";
import { SearchPanel } from "@/components/shop/search/searchPanel";
import { useRouter } from "next/navigation";

export default function Search() {
  const router = useRouter();

  return (
    <div>
      <SearchPanel isOpen onClose={() => router.back()} />
    </div>
  );
}
