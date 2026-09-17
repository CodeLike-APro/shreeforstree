"use client";
import { Minus, Plus } from "lucide-react";
import { MAX_CART_ITEMS } from "@/lib/constants";

type QuantitySelectorProps = {
  quantity: number | "";
  onQuantityChange: (quantity: number | "") => void;
  size?: "sm" | "md";
};

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  size = "md",
}: QuantitySelectorProps) {
  const updateQuantity = (next: number | "") => {
    onQuantityChange(next);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      updateQuantity("");
      return;
    }

    const inputVal = Number(val);
    if (inputVal > MAX_CART_ITEMS) {
      updateQuantity(MAX_CART_ITEMS);
      return;
    }
    if (inputVal < 1) {
      updateQuantity(1);
      return;
    }
    updateQuantity(inputVal);
    return;
  };

  const handleBlur = () => {
    if (quantity === "" || quantity < 1) {
      updateQuantity(1);
    }
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (typeof quantity === "number" && quantity < MAX_CART_ITEMS) {
      updateQuantity(quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (typeof quantity === "number" && quantity > 1) {
      updateQuantity(quantity - 1);
    }
  };

  const sizeClass =
    size === "sm" ? "gap-1 px-1.5 py-1 text-sm" : "gap-2 px-2 py-2.5 text-xl";

  const sizeInputClass = size === "sm" ? "w-7 text-sm" : "w-10 text-xl";

  const sizeButtonClass = size === "sm" ? 14 : 24;

  return (
    <div
      className={`border-ink-25 font-display flex w-fit items-center justify-around rounded-sm border font-bold ${sizeClass}`}
    >
      <button
        className="hover:text-rose-gold btn-focus cursor-pointer rounded-md"
        onClick={handleDecrement}
      >
        <Minus size={sizeButtonClass} />
      </button>
      <span>
        <input
          type="number"
          min="1"
          max={MAX_CART_ITEMS}
          value={quantity}
          onChange={handleInput}
          onBlur={handleBlur}
          className={`[appearance-textfield] text-ink rounded-md ${sizeInputClass} btn-focus border-none text-center font-bold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
      </span>

      <button
        className="hover:text-rose-gold btn-focus cursor-pointer rounded-md"
        onClick={handleIncrement}
      >
        <Plus size={sizeButtonClass} />
      </button>
    </div>
  );
}
