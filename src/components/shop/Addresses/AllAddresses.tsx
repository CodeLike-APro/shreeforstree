"use client";

import { EllipsisVertical, Loader, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AddressModal from "./AddressModal";

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

type IsModalOpen = {
  modalMode: "new" | "edit" | null;
  editingId?: string | null;
};

export default function AllAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDropdownOpenId, setIsDropdownOpenId] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<IsModalOpen>({
    modalMode: null,
    editingId: null,
  });
  const [deleteLoadingIds, setDeleteLoadingIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/addresses");
      if (!res.ok) {
        toast.error("Failed to fetch addresses");
        console.error("Failed to fetch addresses", res);
        setLoading(false);
        return;
      }
      const result = await res.json();
      if (!result.success) {
        toast.error("Failed to fetch addresses");
        console.error("Failed to fetch addresses", result);
        setLoading(false);
        return;
      }
      const data = result.data;
      setAddresses(data);
      setLoading(false);
      return data;
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to fetch addresses");
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAddresses();
  }, [fetchAddresses]);

  const handleDeleteAddress = async (id: string) => {
    try {
      setDeleteLoadingIds((prev) => new Set(prev).add(id));
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete address");
        console.error("Failed to delete address", res);
        setDeleteLoadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        return;
      }
      setDeleteLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      await fetchAddresses();
      toast.success("Address deleted successfully");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
      setDeleteLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      return;
    }
  };

  const toggleDropdown = (id: string) => {
    setIsDropdownOpenId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!isDropdownOpenId) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      setIsDropdownOpenId(null);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpenId(null);
        return;
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [panelRef, isDropdownOpenId]);

  useEffect(() => {
    if (!isDropdownOpenId) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDropdownOpenId]);

  return (
    <div className="flex min-h-40 w-full items-center justify-center rounded-xl">
      {loading ? (
        <p className="font-label">Loading...</p>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="font-label">You do not have any addresses saved.</p>
          <button
            className="font-label border-ink hover:bg-ink hover:text-paper focus:ring-rose-gold-dark rounded-md border px-4 py-2 text-sm font-semibold tracking-widest transition-colors duration-150 focus:ring-2 focus:outline-none"
            onClick={() =>
              setIsAddressModalOpen({ modalMode: "new", editingId: null })
            }
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4 rounded-xl">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="font-label border-ink relative flex w-full justify-between rounded-xl border p-4"
            >
              <div className="flex flex-col items-start justify-center gap-3">
                <div className="flex items-center justify-center gap-2">
                  {address.isDefault && (
                    <label className="bg-blush rounded-md px-2 py-1 text-xs font-semibold tracking-widest uppercase">
                      Default
                    </label>
                  )}
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
              <button
                onClick={() => {
                  toggleDropdown(address.id);
                }}
                className="border-ink hover:bg-ink hover:text-paper focus:ring-rose-gold-dark absolute top-1 right-2 flex rounded-full border px-px py-1 transition-colors duration-150 focus:border-transparent focus:ring-2 focus:outline-none"
              >
                <div>
                  <EllipsisVertical size={17} />
                </div>
              </button>
              {isDropdownOpenId === address.id && (
                <div
                  ref={panelRef}
                  className="border-ink-25 bg-paper absolute top-7 right-7 flex w-[10vw] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-1 shadow-md"
                >
                  <button
                    onClick={() =>
                      setIsAddressModalOpen({
                        modalMode: "edit",
                        editingId: address.id,
                      })
                    }
                    className="hover:bg-ink/10 focus:ring-rose-gold-dark flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 focus:ring-2 focus:outline-none"
                  >
                    <div className="flex w-[40%] items-center justify-start">
                      <Pencil size={14} />
                    </div>
                    <div className="text-md mt-0.5 w-full self-start font-medium">
                      <p className="text-start">Edit</p>
                    </div>
                  </button>
                  <div className="bg-ink-25 h-px w-full"></div>
                  <button
                    disabled={deleteLoadingIds.has(address.id)}
                    onClick={() => handleDeleteAddress(address.id)}
                    className={[
                      "hover:bg-ink/10 focus:ring-rose-gold-dark flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 focus:ring-2 focus:outline-none",
                      deleteLoadingIds.has(address.id)
                        ? "cursor-not-allowed opacity-50"
                        : "",
                    ].join(" ")}
                  >
                    <div className="flex w-[40%] items-center justify-start">
                      <Trash2 size={14} />
                    </div>
                    <div className="text-md mt-0.5 w-full self-start font-medium">
                      <p className="text-start">Delete</p>
                    </div>
                    {deleteLoadingIds.has(address.id) && (
                      <div className="animate-spin">
                        <Loader size={14} />
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <AddressModal
        isOpen={isAddressModalOpen.modalMode !== null}
        title={isAddressModalOpen.modalMode ?? undefined}
        id={isAddressModalOpen.editingId ?? undefined}
        onClose={() =>
          setIsAddressModalOpen({ modalMode: null, editingId: null })
        }
      />
    </div>
  );
}
