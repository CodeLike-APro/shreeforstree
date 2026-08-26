"use client";
import { useState } from "react";
import AddToBag from "./AddToBag";
import QuantitySelector from "./QuantitySelector";
import { PRODUCT_SIZES } from "@/lib/db/schema";

type ProductPurchaseProps = {
  sizes: (typeof PRODUCT_SIZES)[number][];
  price: number;
};

export default function ProductPurchase({
  sizes,
  price,
}: ProductPurchaseProps) {
  const [selectedSize, setSelectedSize] = useState<
    (typeof PRODUCT_SIZES)[number] | ""
  >("");

  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h6 className="font-label text-ink text-sm tracking-widest uppercase">
          Select size
        </h6>
        <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
          {sizes?.map((s) => (
            <button
              className={[
                "border-ink-25 hover:border-ink-40 rounded-sm border px-4 py-2 transition-colors duration-300",
                selectedSize === s ? "bg-ink text-paper" : "",
              ].join(" ")}
              key={s}
              onClick={() => setSelectedSize(s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <QuantitySelector quantity={quantity} OnQuantityChange={setQuantity} />
        <AddToBag size={selectedSize} quantity={quantity} price={price} />
      </div>
    </div>
  );
}
