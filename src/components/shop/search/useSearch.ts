"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export const STORAGE_KEY = "sft_recent_searches";

export function useSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeRecent = useCallback(
    (term: string) => {
      const updated = recentSearches.filter((r) => r !== term);
      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [recentSearches],
  );

  const submit = useCallback(
    (term?: string) => {
      const searchTerm = (term ?? query).trim();
      if (!searchTerm) return;

      const updated = [
        searchTerm,
        ...recentSearches.filter((r) => r !== searchTerm),
      ].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      router.push(`/shop?search=${encodeURIComponent(searchTerm)}`);
      close();
    },
    [query, recentSearches, close, router],
  );

  return {
    isOpen,
    query,
    recentSearches,
    open,
    close,
    setQuery,
    submit,
    clearRecent,
    removeRecent,
  };
}
