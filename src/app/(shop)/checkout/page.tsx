"use client";

import AddressModal from "@/components/shop/Address";
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

      <div>
        <h4>Delivery Address</h4>
        <button onClick={() => setIsOpen(true)}>Change address</button>
      </div>
      <div className="relative">
        <AddressModal
          title="new"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </div>
  );
}
