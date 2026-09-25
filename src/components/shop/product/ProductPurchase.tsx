"use client";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AddToBag from "./AddToBag";
import QuantitySelector from "./QuantitySelector";

import type { PRODUCT_SIZES } from "@/lib/constants";

type ProductPurchaseProps = {
  sizes: (typeof PRODUCT_SIZES)[number][];
  price: number;
  sizeGuide?: string | null;
  productId: string;
};

export default function ProductPurchase({
  sizes,
  price,
  sizeGuide,
  productId,
}: ProductPurchaseProps) {
  const [selectedSize, setSelectedSize] = useState<
    (typeof PRODUCT_SIZES)[number] | ""
  >("");

  const [quantity, setQuantity] = useState<number | "">(1);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLHeadingElement>(null);

  // Handle Outside Click for Size Guide Modal

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="relative flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between">
          <h6 className="font-label text-ink text-xs tracking-widest uppercase">
            Select size
          </h6>
          <button
            onClick={() => setIsOpen(true)}
            className="font-label text-rose-gold hover:text-rose-gold-dark btn-focus cursor-pointer rounded-md px-2 py-1 text-xs tracking-widest uppercase hover:underline"
          >
            size guide
          </button>
        </div>

        {/* Size Guide Modal */}

        {isOpen && sizeGuide && (
          <div className="bg-ink/50 fixed inset-0 z-50 flex h-screen w-full items-center justify-center backdrop-blur-md">
            <div
              ref={panelRef}
              className="bg-paper absolute flex h-[75%] w-[60%] flex-col rounded-lg"
            >
              <div className="border-ink-25 flex shrink-0 items-center justify-between border-b p-4">
                <h4 className="font-display text-ink text-lg tracking-widest uppercase">
                  Size Guide
                </h4>
                <button
                  className="text-ink hover:text-paper hover:bg-ink border-ink btn-focus cursor-pointer rounded-full border p-2"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="min-h-0 w-full flex-1 overflow-y-auto">
                <Image
                  width={0}
                  height={0}
                  sizes="contain"
                  src={sizeGuide}
                  alt="Size Guide"
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          {sizes?.map((s) => (
            <button
              className={[
                "border-ink-25 hover:border-ink-40 btn-focus rounded-sm border px-4 py-2",
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

      <div className="mt-4 flex gap-3">
        <QuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          size="md"
        />
        <AddToBag
          size={selectedSize}
          quantity={quantity}
          price={price}
          productId={productId}
        />
      </div>
    </div>
  );
}
