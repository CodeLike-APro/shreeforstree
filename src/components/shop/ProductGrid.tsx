import Card from "@/utils/Card";
import type { ProductsWithMediaAndCategories } from "@/lib/queries/products";

export default function ProductGrid({
  allProducts,
}: {
  allProducts: ProductsWithMediaAndCategories;
}) {
  return (
    <div className="grid aspect-3/4 grid-cols-2 gap-8 pt-12 md:grid-cols-3 lg:grid-cols-4">
      {allProducts.map((product) => (
        <Card
          variant="customer-product"
          data={{ ...product }}
          href={`/shop/${product.slug}`}
          key={product.id}
        />
      ))}
    </div>
  );
}
