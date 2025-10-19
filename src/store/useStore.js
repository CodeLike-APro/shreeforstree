// src/store/useStore.js
import { create } from "zustand";

export const useStore = create((set, get) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  filterProducts: (products) => {
    const query = get().searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((p) =>
      [
        p.title,
        p.color,
        p.description,
        ...(p.tags || []),
        ...(p.category ? [p.category] : []),
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  },
}));
