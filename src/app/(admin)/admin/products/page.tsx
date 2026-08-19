"use client";

import Card from "@/utils/card";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  title: string;
  isActive: boolean;
  [key: string]: unknown;
}

export default function products() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setProductsError(false);
        const res = await fetch("/api/products");
        if (!res.ok) {
          setProductsError(true);
          return;
        }
        const result = await res.json();
        if (!result.success) {
          setProductsError(true);
          return;
        }
        const list = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result.data?.products ?? []);
        setProducts(list);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProductsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleToggleStatus = useCallback(async (product: ProductRow) => {
    const next = !product.isActive;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.message ?? "Couldn't update the product.");
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: next } : p)),
      );
      toast.success(next ? "Product activated." : "Product deactivated.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }, []);

  const handleDelete = useCallback(async (product: ProductRow) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.message ?? "Couldn't delete the product.");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Product deleted.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }, []);

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6 sm:justify-start items-start content-start transition-all">
      {products.map((product, index) => (
        <Card
          key={index}
          variant="admin-product"
          data={{ ...product, variant: "admin-product" }}
          onEdit={(id) => router.push(`/admin/products/${id}`)}
          onViewOnStore={() =>
            window.open(
              `/product/${product.slug}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
          onToggleStatus={() => handleToggleStatus(product)}
          onDelete={() => handleDelete(product)}
        />
      ))}
    </div>
  );
}
