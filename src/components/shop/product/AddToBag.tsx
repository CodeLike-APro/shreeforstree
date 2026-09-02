"use client";

import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AddToBag({
  size,
  quantity = 1,
  price,
  productId,
}: {
  size: string;
  quantity: number | "";
  price: number;
  productId: string;
}) {
  const totalQuan = typeof quantity === "number" ? quantity : 1;
  const totalPrice = typeof quantity === "number" ? totalQuan * price : price;
  const [loading, setLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const handleAddToBag = async () => {
    if (!size) {
      toast.error("Please select a size before adding to bag.");
      return;
    }

    try {
      setLoading(true);
      setCartError(null);

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          size,
          quantity: totalQuan,
        }),
      });

      if (!res.ok) {
        console.log("Failed to add to bag", res);
        return;
      }

      toast.success("Added to bag!");
    } catch (error) {
      console.error("Error adding to bag:", error);
      setCartError("Error adding to bag");
      toast.error("Error adding to bag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={!size || loading}
        onClick={handleAddToBag}
        className={[
          "bg-ink btn-focus text-paper font-label border-ink w-full rounded-sm border px-4 py-3 tracking-widest uppercase",
          size && !loading ? "cursor-pointer" : "cursor-not-allowed",
        ].join(" ")}
      >
        {!size ? (
          <p className="">Select a size</p>
        ) : loading ? (
          <p className="flex items-center justify-center gap-2">
            Adding to bag <Loader size={14} className="mb-1 animate-spin" />
          </p>
        ) : (
          <p className="">
            Add to Bag - {totalQuan} &middot; {totalPrice}
          </p>
        )}
      </button>

      {cartError && (
        <p className="font-label mt-2 text-sm text-red-500">{cartError}</p>
      )}
    </div>
  );
}
