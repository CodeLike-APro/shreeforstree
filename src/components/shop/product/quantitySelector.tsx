"use client";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export default function QuantitySelector() {
  const [value, setValue] = useState(1);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setValue("" as unknown as number);
      return;
    }

    const inputVal = Number(val);
    if (inputVal > MAX_CART_ITEMS) {
      setValue(MAX_CART_ITEMS);
      return;
    }
    if (inputVal < 1) {
      setValue(1);
      return;
    }
    setValue(inputVal);
    return;
  };

  const handleBlur = () => {
    if (value === ("" as unknown as number) || value < 1) {
      setValue(1);
    }
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (value < MAX_CART_ITEMS) {
      setValue(value + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (value > 1) {
      setValue(value - 1);
    }
  };

  return (
    <div className="border-ink-25 font-display flex w-fit items-center justify-around gap-2 rounded-sm border px-2 py-3 text-xl font-bold">
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
          value={value}
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
