"use client";

import AddressModal from "@/components/shop/Addresses/AddressModal";
import AllAddresses from "@/components/shop/Addresses/AllAddresses";
import { useState } from "react";

export default function Checkout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-2 px-10 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-wide">Checkout</h1>
        <p className="text-ink-40 text-md font-label">
          Confirm where this is going, then place your order.
        </p>
      </div>

      <div className="flex w-full items-center justify-between">
        <h4 className="font-label font-bold tracking-wide">Delivery Address</h4>
        <button
          onClick={() => setIsOpen(true)}
          className="font-label text-md border-ink bg-paper text-ink hover:bg-ink hover:text-paper focus:ring-rose-gold rounded-md border px-4 py-1.5 transition-colors duration-150 focus:border-transparent focus:ring-2 focus:outline-none"
        >
          Change address
        </button>
      </div>
      <div className="relative">
        <AddressModal
          title="new"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
      <div className="w-full">
        <AllAddresses />
      </div>
    </div>
  );
}
