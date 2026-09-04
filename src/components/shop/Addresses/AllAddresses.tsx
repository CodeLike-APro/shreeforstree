"use client";

import { EllipsisVertical, Loader, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AddressModal from "./AddressModal";
import { AnimatePresence, motion } from "motion/react";
import { AddressShimmer } from "@/components/ui/Shimmer";
import { useSession } from "@/lib/auth-client";

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

export default function AllAddresses({
  expand,
  onCollapse,
}: {
  expand: boolean;
  onCollapse: () => void;
}) {
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data: session, isPending } = useSession();
  const isGuest = !isPending && !session;

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      if (isPending) {
        return;
      }
      if (!isGuest) {
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
        setSelectedId((prev) => {
          if (prev && data.some((a: Address) => a.id === prev)) return prev;
          return (
            data.find((a: Address) => a.isDefault)?.id ?? data[0]?.id ?? null
          );
        });
        setLoading(false);
        return data;
      } else {
        try {
          const raw = localStorage.getItem("guestAddress");
          const parsed = raw ? JSON.parse(raw) : [];
          const existingAddress: Address[] = Array.isArray(parsed)
            ? parsed
            : [];
          setAddresses(existingAddress);
          setSelectedId((prev) => {
            if (prev && existingAddress.some((a: Address) => a.id === prev))
              return prev;
            return (
              existingAddress.find((a: Address) => a.isDefault)?.id ??
              existingAddress[0]?.id ??
              null
            );
          });
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error fetching guest addresses:", error);
          toast.error("Failed to fetch guest addresses");
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to fetch addresses");
      setLoading(false);
      return;
    }
  }, [isGuest, isPending]);

  useEffect(() => {
    const fetchingAddress = () => {
      return fetchAddresses();
    };
    fetchingAddress();
  }, [fetchAddresses]);

  const handleDeleteAddress = async (id: string) => {
    try {
      setDeleteLoadingIds((prev) => new Set(prev).add(id));
      if (isGuest) {
        const updatedAddresses = addresses.filter(
          (address) => address.id !== id,
        );
        localStorage.setItem("guestAddress", JSON.stringify(updatedAddresses));
        setDeleteLoadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
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
      }
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
    if (!expand) return;
    if (isDropdownOpenId) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCollapse();
        return;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  });

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
    if (!expand)
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    return;
  }, [expand]);

  useEffect(() => {
    if (!isDropdownOpenId) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDropdownOpenId]);

  const visibleAddress = expand
    ? addresses
    : addresses.filter((a) => a.id === selectedId);

  const confirmAddress = (id: string) => {
    if (!expand) return;
    setIsDropdownOpenId(null);
    setSelectedId(id);
    onCollapse();
  };

  return (
    <div
      ref={containerRef}
      className="border-ink flex min-h-40 w-full items-center justify-center rounded-xl py-4"
    >
      {loading ? (
        <AddressShimmer />
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="font-label">You do not have any addresses saved.</p>
          <button
            className="font-label border-ink hover:bg-ink hover:text-paper btn-focus rounded-md border px-4 py-2 text-sm font-semibold tracking-widest"
            onClick={() =>
              setIsAddressModalOpen({ modalMode: "new", editingId: null })
            }
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col rounded-xl">
          {expand && (
            <button
              onClick={() =>
                setIsAddressModalOpen({
                  modalMode: "new",
                  editingId: null,
                })
              }
              className="font-label text-md border-ink text-ink hover:bg-ink hover:text-paper btn-focus absolute top-0 right-0 rounded-md border px-4 py-1.5"
            >
              Add Address
            </button>
          )}
          <div
            role="radiogroup"
            aria-label="Delivery address"
            className="relative"
          >
            <AnimatePresence mode="popLayout">
              {visibleAddress.map((address) => (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                  transition={{
                    layout: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                    duration: 0.25,
                  }}
                  onClick={(e) => {
                    if (e.detail === 0) return;
                    confirmAddress(address.id);
                  }}
                  key={address.id}
                  layout
                  className={[
                    "font-label border-ink relative mt-4 flex w-full justify-between overflow-hidden rounded-xl border p-4",
                    expand ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  {expand && (
                    <>
                      <input
                        type="radio"
                        aria-label={`${address.label}, ${address.fullName}, ${address.addressLine1}, ${address.addressLine2 ?? ""}, ${address.city}, ${address.state}, ${address.pincode}`}
                        className="peer sr-only"
                        name="address"
                        id={address.id}
                        checked={selectedId === address.id}
                        onChange={() => setSelectedId(address.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            confirmAddress(address.id);
                          }
                        }}
                      />
                      <label
                        htmlFor={address.id}
                        className={[
                          "peer-focus-ring absolute inset-0.5 rounded-lg",
                          expand ? "cursor-pointer" : "",
                        ].join(" ")}
                      />
                    </>
                  )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(address.id);
                    }}
                    className="btn-focus border-ink hover:bg-ink hover:text-paper absolute top-1 right-2 z-10 flex rounded-full border px-px py-1"
                  >
                    <div>
                      <EllipsisVertical size={17} />
                    </div>
                  </button>
                  {isDropdownOpenId === address.id && (
                    <div
                      ref={panelRef}
                      className="border-ink-25 bg-paper absolute top-7 right-7 z-20 flex w-[10vw] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-1 shadow-md"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddressModalOpen({
                            modalMode: "edit",
                            editingId: address.id,
                          });
                        }}
                        className="hover:bg-ink/10 btn-focus flex w-full items-center justify-center gap-1 rounded-md px-2 py-1"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                        className={[
                          "hover:bg-ink/10 btn-focus flex w-full items-center justify-center gap-1 rounded-md px-2 py-1",
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      <AddressModal
        isOpen={isAddressModalOpen.modalMode !== null}
        title={isAddressModalOpen.modalMode ?? undefined}
        id={isAddressModalOpen.editingId ?? undefined}
        onSaved={fetchAddresses}
        onClose={() =>
          setIsAddressModalOpen({ modalMode: null, editingId: null })
        }
        isGuest={isGuest}
      />
    </div>
  );
}
