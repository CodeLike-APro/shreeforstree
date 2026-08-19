"use client";
import { SearchPanel } from "@/components/shop/search/searchPanel";
import { useSearch } from "@/components/shop/search/useSearch";

export default function Search() {
  const { isOpen, open, close } = useSearch();
  if (!isOpen) open();
  return (
    <div>
      <SearchPanel isOpen={isOpen} onClose={close} />
    </div>
  );
}
