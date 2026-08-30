"use client";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { Minus, Plus } from "lucide-react";

type QuantitySelectorProps = {
  quantity: number | "";
  OnQuantityChange: (quantity: number | "") => void;
};

export default function QuantitySelector({
  quantity,
  OnQuantityChange,
}: QuantitySelectorProps) {
  const updateQuantity = (next: number | "") => {
    OnQuantityChange(next);

    if (next !== "") {
      OnQuantityChange(next);
    }
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

  return (
    <div className="border-ink-25 font-display flex w-fit items-center justify-around gap-2 rounded-sm border px-2 py-2.5 text-xl font-bold">
      <button
        className="hover:text-rose-gold cursor-pointer"
        onClick={handleDecrement}
      >
        <Minus />
      </button>
      <span>
        <input
          type="number"
          min="1"
          max={MAX_CART_ITEMS}
          value={quantity}
          onChange={handleInput}
          onBlur={handleBlur}
          className="focus-ring-0 [appearance-textfield] text-ink w-10 border-none text-center text-xl font-bold focus:ring-offset-0 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </span>

      <button
        className="hover:text-rose-gold cursor-pointer"
        onClick={handleIncrement}
      >
        <Plus />
      </button>
    </div>
  );
}
