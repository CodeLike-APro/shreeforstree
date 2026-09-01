"use client";

import { EllipsisVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  country: string;
  isDefault: boolean;
};

export default function AllAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/addresses");
        if (!res.ok) {
          toast.error("Failed to fetch addresses");
          console.error("Failed to fetch addresses", res);
          return;
        }
        const result = await res.json();
        if (!result.success) {
          toast.error("Failed to fetch addresses");
          console.error("Failed to fetch addresses", result);
          return;
        }
        const data = result.data;
        setAddresses(data);
        return data;
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };

    fetchAddresses();
  }, []);

  return (
    <div className="border-ink relative w-full rounded-xl border p-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="font-label flex w-full justify-between"
        >
          <div className="flex flex-col items-start justify-center gap-3">
            <div className="flex items-center justify-center gap-2">
              <label className="bg-blush rounded-md px-2 py-1 text-xs font-semibold tracking-widest uppercase">
                {address.isDefault ? "Default" : ""}
              </label>
              <label className="bg-ink text-paper rounded-md px-2 py-1 text-xs font-semibold tracking-widest uppercase">
                {address.label}
              </label>
            </div>
            <div className="flex flex-col items-start justify-center">
              <h6 className="font-display text-lg font-bold">
                {address.fullName}
              </h6>
              <p className="text-ink-55">{address.phone}</p>
            </div>
          </div>
          <div className="font-label flex w-[60%] flex-col">
            <p>{address.addressLine1}</p>
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            <p>
              {address.city}, {address.state}
            </p>
            <p>{address.pincode}</p>
          </div>
        </div>
      ))}
      <button className="border-ink hover:bg-ink hover:text-paper focus:ring-rose-gold-dark absolute top-4 right-4 flex rounded-full border px-1 py-2 transition-colors duration-150 focus:border-transparent focus:ring-2 focus:outline-none">
        <div>
          <EllipsisVertical size={17} />
        </div>
      </button>
    </div>
  );
}
