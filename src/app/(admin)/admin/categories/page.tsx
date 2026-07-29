"use client";

import Card from "@/utils/card";
import { CardShimmerGrid } from "@/components/ui/Shimmer";
import { AlertCircle, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface CategoryRow {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  [key: string]: unknown;
}

export default function categories() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchCategories = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleStatus = useCallback(async (category: CategoryRow) => {
    const next = !category.isActive;
    try {
      const res = await fetch(`/api/categories/${category.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.message ?? "Couldn't update the category.");
        return;
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, isActive: next } : c,
        ),
      );
      toast.success(next ? "Category activated." : "Category deactivated.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }, []);

  const handleDelete = useCallback(async (category: CategoryRow) => {
    try {
      const res = await fetch(`/api/categories/${category.slug}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.message ?? "Couldn't delete the category.");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success("Category deleted.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }, []);

  const wrapperClass =
    "min-h-screen w-full p-6 flex flex-wrap gap-6 justify-center sm:justify-start items-start content-start transition-all";

  if (loading) {
    return (
      <div className={wrapperClass}>
        <CardShimmerGrid count={8} />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className={`${wrapperClass} justify-center! items-center!`}>
        <div className="flex flex-col items-center text-center gap-4 max-w-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rust/10 text-rust">
            <AlertCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl text-ink mb-1">
              Couldn&apos;t load categories
            </h2>
            <p className="text-sm text-ink-55">
              Something went wrong while fetching your categories. Please try
              again.
            </p>
          </div>
          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-sm hover:opacity-90 transition-opacity"
          >
            <RotateCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`${wrapperClass} justify-center! items-center!`}>
        <div className="flex flex-col items-center text-center gap-2 max-w-sm">
          <h2 className="text-xl text-ink">No categories yet</h2>
          <p className="text-sm text-ink-55">
            Create your first category to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {categories.map((category, index) => (
        <Card
          key={index}
          variant="admin-category"
          data={{ ...category, variant: "admin-category" }}
          onEdit={() => router.push(`/admin/categories/${category.slug}`)}
          onViewOnStore={() =>
            window.open(
              `/category/${category.slug}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
          onToggleStatus={() => handleToggleStatus(category)}
          onDelete={() => handleDelete(category)}
        />
      ))}
    </div>
  );
}
