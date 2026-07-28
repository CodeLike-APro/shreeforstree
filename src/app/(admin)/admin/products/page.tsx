"use client";

import Card from "@/utils/card";
import { useEffect, useState } from "react";

export default function products() {
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
  return (
    <div className="min-h-screen w-full grid grid-cols-3 gap-2 flex-wrap">
      {products.map((product, index) => (
        <Card
          key={index}
          variant="admin-product"
          data={{ ...product, variant: "admin-product" }}
        />
      ))}
    </div>
  );
}
