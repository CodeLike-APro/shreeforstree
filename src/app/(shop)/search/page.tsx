"use client";
import { useRouter } from "next/navigation";
import { SearchPanel } from "@/components/shop/search/searchPanel";

export default function Search() {
  const router = useRouter();

  return (
    <div>
      <SearchPanel isOpen onClose={() => router.back()} />
    </div>
  );
}
