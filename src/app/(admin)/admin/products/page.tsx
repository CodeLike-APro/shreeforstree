"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CardShimmerGrid } from "@/components/ui/Shimmer";
import Card from "@/utils/Card";

import type { ApiPaginatedResult, ApiResult, Jsonified } from "@/types/api";
import type { ProductDetail, ProductListItem } from "@/types/api/products";

export default function Products() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [products, setProducts] = useState<Jsonified<ProductListItem>[]>([]);

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
        const result: ApiPaginatedResult<ProductListItem> = await res.json();
        if (!result.success) {
          setProductsError(true);
          return;
        }
        setProducts(result.data);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProductsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleToggleStatus = useCallback(
    async (product: Jsonified<ProductListItem>) => {
      const next = !product.isActive;
      try {
        const res = await fetch(`/api/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: next }),
        });
        const payload: ApiResult<ProductDetail> = await res
          .json()
          .catch(() => null);
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
    },
    [],
  );

  const handleDelete = useCallback(
    async (product: Jsonified<ProductListItem>) => {
      try {
        const res = await fetch(`/api/products/${product.id}`, {
          method: "DELETE",
        });
        const payload: ApiResult<null> = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(payload?.message ?? "Couldn't delete the product.");
          return;
        }
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        toast.success("Product deleted.");
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    },
    [],
  );

  return (
    <div className="grid min-h-screen w-full grid-cols-2 content-start items-start gap-4 p-4 transition-all sm:flex sm:flex-wrap sm:justify-start sm:gap-6 sm:p-6">
      {loading ? (
        <CardShimmerGrid count={8} />
      ) : productsError ? (
        <p>Failed to load products.</p>
      ) : (
        products.map((product) => (
          <Card
            key={product.id}
            variant="admin-product"
            data={{ ...product }}
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
        ))
      )}
    </div>
  );
}
