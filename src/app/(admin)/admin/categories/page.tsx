"use client";

import Card from "@/utils/card";
import { useEffect, useState } from "react";

export default function categories() {
  const [loading, setLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setCategoriesError(false);
        const res = await fetch("/api/categories");
        if (!res.ok) {
          setCategoriesError(true);
          return;
        }
        const result = await res.json();
        if (!result.success) {
          setCategoriesError(true);
          return;
        }
        const list = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result.data?.categories ?? []);
        setCategories(list);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategoriesError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  return (
    <div className="min-h-screen w-full p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 justify-items-center sm:justify-items-start content-start">
      {categories.map((category, index) => (
        <Card
          key={index}
          variant="admin-category"
          data={{ ...category, variant: "admin-category" }}
        />
      ))}
    </div>
  );
}
