"use client";
import { ProductsWithMediaAndCategories } from "@/lib/queries/products";
import Card from "@/utils/card";
import { useRouter } from "next/navigation";

export default function ProductGrid({
  allProducts,
}: {
  allProducts: ProductsWithMediaAndCategories;
}) {
  const router = useRouter();

  return (
    <div className="grid aspect-3/4 grid-cols-2 gap-8 pt-12 md:grid-cols-3 lg:grid-cols-4">
      {allProducts.map((product) => (
        <Card
          variant="customer-product"
          data={{ ...product }}
          onClick={(id) => {
            router.push(`/shop/${id}`);
          }}
          key={product.id}
        />
      ))}
    </div>
  );
}
