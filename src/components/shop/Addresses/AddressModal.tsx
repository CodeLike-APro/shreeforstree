"use client";

import { createAddressSchema } from "@/lib/validators/address.validators";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const inputBaseClasses: string =
  "peer border-ink/35 font-label h-9 w-full rounded-md border-[1.5] px-2 py-3 placeholder:text-sm btn-focus";

const hideSpinButtons: string =
  "appearance-text-field [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const labelBaseClasses: string =
  "peer-focus:text-rose-gold-dark font-label bg-paper absolute -top-2 left-2 px-1 text-xs font-medium text-gray-700 transition-all duration-300 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:text-sm peer-focus:translate-y-0 peer-focus:text-xs pointer-events-none";

const focusableSelector: string =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

const errorBaseClasses: string = "font-label mt-1 text-sm text-red-600";

type FieldErrors = Partial<
  Record<keyof typeof createAddressSchema.shape, string[]>
>;

export default function AddressModal({
  isOpen,
  onSaved,
  onClose,
  title = "new",
  id,
  isGuest = false,
}: {
  isOpen: boolean;
  onSaved?: () => void;
  onClose: () => void;
  title?: "new" | "edit";
  id?: string;
  isGuest?: boolean;
}) {
  const AddressTitle = title === "new" ? "Add new address" : "Edit Address";

  const [label, setLabel] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [addressLine1, setAddressLine1] = useState<string | null>(null);
  const [addressLine2, setAddressLine2] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [pincode, setPincode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const panelRef = useRef<HTMLFormElement>(null);

  const addressData = {
    label: label ? label.trim() : undefined,
    fullName: fullName ? fullName.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    addressLine1: addressLine1 ? addressLine1.trim() : undefined,
    addressLine2: addressLine2 ? addressLine2.trim() : undefined,
    city: city ? city.trim() : undefined,
    state: state ? state.trim() : undefined,
    pincode: pincode ? pincode.trim() : undefined,
  };

  const url = title === "new" ? "/api/addresses" : `/api/addresses/${id}`;

  const handleSave = async () => {
    try {
      setLoading(true);
      setErrors({}); // Clear previous errors
      const result = await createAddressSchema.safeParseAsync(addressData);
      if (!result.success) {
        const fieldErrors = result.error.flatten(
          (issue) => issue.message,
        ).fieldErrors;
        setErrors(fieldErrors);
        toast.error("Please fix the highlighted fields."); // render under each input
        setLoading(false);
        return;
      }
      if (isGuest) {
        try {
          if (title === "new") {
            const raw = localStorage.getItem("guestAddress");
            const parsed = raw ? JSON.parse(raw) : [];
            const existingAddresses = Array.isArray(parsed) ? parsed : [];
            localStorage.setItem(
              "guestAddress",
              JSON.stringify([
                ...existingAddresses,
                { ...addressData, id: crypto.randomUUID() },
              ]),
            );
            toast.success("Address saved successfully");
            setLoading(false);
            onSaved?.();
            onClose();
            return;
          } else if (title === "edit" && id) {
            const raw = localStorage.getItem("guestAddress");
            const parsed = raw ? JSON.parse(raw) : [];
            const existingAddresses = Array.isArray(parsed) ? parsed : [];
            const updatedAddresses = existingAddresses.map((address) =>
              address.id === id ? { ...address, ...addressData } : address,
            );
            localStorage.setItem(
              "guestAddress",
              JSON.stringify(updatedAddresses),
            );
            toast.success("Address updated successfully");
            setLoading(false);
            onSaved?.();
            onClose();
            return;
          }
        } catch (error) {
          console.error("Error saving guest address:", error);
          toast.error("Failed to save address. Please try again.");
          setLoading(false);
          return;
        }
      } else {
        const res = await fetch(url, {
          method: title === "new" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(addressData),
        });
        if (!res.ok) {
          toast.error("Failed to save address");
          setLoading(false);
          return;
        }
        const result = await res.json();
        if (!result.success) {
          toast.error("Failed to save address");
          setLoading(false);
          return;
        }
        toast.success("Address saved successfully");
        setLoading(false);
        onSaved?.();
        onClose();
        return;
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address. Please try again.");
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (title === "edit" && id && isOpen) {
      if (isGuest) {
        try {
          const raw = localStorage.getItem("guestAddress");
          const parsed = raw ? JSON.parse(raw) : [];
          const existingAddresses = Array.isArray(parsed) ? parsed : [];
          const addressToEdit = existingAddresses.find(
            (address) => address.id === id,
          );
          if (addressToEdit) {
            const resetTimeout = window.setTimeout(() => {
              setLabel(addressToEdit.label || null);
              setFullName(addressToEdit.fullName || null);
              setPhone(addressToEdit.phone || null);
              setAddressLine1(addressToEdit.addressLine1 || null);
              setAddressLine2(addressToEdit.addressLine2 || null);
              setCity(addressToEdit.city || null);
              setState(addressToEdit.state || null);
              setPincode(addressToEdit.pincode || null);
            }, 0);

            return () => window.clearTimeout(resetTimeout);
          }
        } catch (error) {
          console.error("Error fetching guest address:", error);
          toast.error("Failed to fetch address");
          return;
        }
      } else {
        const fetchAddress = async () => {
          setFetchLoading(true);
          try {
            const res = await fetch(`/api/addresses/${id}`);
            if (!res.ok) {
              toast.error("Failed to fetch address");
              console.error("Failed to fetch address", res);
              setFetchLoading(false);
              return;
            }
            const result = await res.json();
            if (!result.success) {
              toast.error("Failed to fetch address");
              console.error("Failed to fetch address", result);
              setFetchLoading(false);
              return;
            }
            setFetchLoading(false);
            const data = result.data;
            setLabel(data.label);
            setFullName(data.fullName);
            setPhone(data.phone);
            setAddressLine1(data.addressLine1);
            setAddressLine2(data.addressLine2);
            setCity(data.city);
            setState(data.state);
            setPincode(data.pincode);
          } catch (error) {
            console.error("Error fetching address:", error);
            toast.error("Failed to fetch address");
            setFetchLoading(false);
            return;
          }
        };
        fetchAddress();
      }
    } else if (title === "new" && isOpen) {
      const resetTimeout = window.setTimeout(() => {
        setLabel(null);
        setFullName(null);
        setPhone(null);
        setAddressLine1(null);
        setAddressLine2(null);
        setCity(null);
        setState(null);
        setPincode(null);
        setErrors({}); // Clear previous errors when opening the modal for a new address
      }, 0);

      return () => window.clearTimeout(resetTimeout);
    }
  }, [id, title, isOpen, isGuest]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const getFocusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((el) => el.getClientRects().length > 0) as HTMLElement[];

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (getFocusable.length === 0) {
        e.preventDefault();
      }

      const first = getFocusable[0];
      const last = getFocusable[getFocusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
        return;
      }

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
        return;
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div>
      {isOpen && (
        <div className="bg-ink-25 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-form-title"
            ref={panelRef}
            className="bg-paper flex w-[45%] max-w-150 min-w-90 flex-col gap-4 rounded-2xl px-6 py-8 transition-all duration-150"
          >
            {fetchLoading ? (
              <div className="flex animate-spin items-center justify-center">
                <Loader size={24} />
              </div>
            ) : (
              <>
                <div>
                  <h1 id="address-form-title" className="text-xl">
                    {AddressTitle}
                  </h1>
                  <p className="text-ink-55 font-label text-md">
                    We deliver within India only.
                  </p>
                </div>
                <div className="relative">
                  <input
                    id="label"
                    name="label"
                    type="text"
                    value={label || ""}
                    placeholder=" "
                    aria-invalid={errors.label ? "true" : "false"}
                    aria-describedby={errors.label ? "label-error" : undefined}
                    className={inputBaseClasses}
                    onChange={(e) => setLabel(e.target.value)}
                  ></input>
                  <label htmlFor="label" className={labelBaseClasses}>
                    Label
                  </label>
                  {errors.label && (
                    <p id="label-error" className={errorBaseClasses}>
                      {errors.label[0]}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName || ""}
                    placeholder=" "
                    aria-invalid={errors.fullName ? "true" : "false"}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                    className={inputBaseClasses}
                    onChange={(e) => setFullName(e.target.value)}
                  ></input>
                  <label htmlFor="fullName" className={labelBaseClasses}>
                    Full Name
                  </label>
                  {errors.fullName && (
                    <p id="fullName-error" className={errorBaseClasses}>
                      {errors.fullName[0]}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="phone"
                    name="phone"
                    type="number"
                    value={phone || ""}
                    placeholder=" "
                    aria-invalid={errors.phone ? "true" : "false"}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    className={inputBaseClasses + " " + hideSpinButtons}
                    onChange={(e) => setPhone(e.target.value)}
                  ></input>
                  <label htmlFor="phone" className={labelBaseClasses}>
                    Phone
                  </label>
                  {errors.phone && (
                    <p id="phone-error" className={errorBaseClasses}>
                      {errors.phone[0]}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    value={addressLine1 || ""}
                    aria-invalid={errors.addressLine1 ? "true" : "false"}
                    aria-describedby={
                      errors.addressLine1 ? "addressLine1-error" : undefined
                    }
                    placeholder=" "
                    className={inputBaseClasses}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  ></input>
                  <label htmlFor="addressLine1" className={labelBaseClasses}>
                    Address Line 1
                  </label>
                  {errors.addressLine1 && (
                    <p id="addressLine1-error" className={errorBaseClasses}>
                      {errors.addressLine1[0]}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    type="text"
                    value={addressLine2 || ""}
                    placeholder=" "
                    aria-invalid={errors.addressLine2 ? "true" : "false"}
                    aria-describedby={
                      errors.addressLine2 ? "addressLine2-error" : undefined
                    }
                    className={inputBaseClasses}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  ></input>
                  <label htmlFor="addressLine2" className={labelBaseClasses}>
                    Address Line 2 (optional)
                  </label>
                  {errors.addressLine2 && (
                    <p id="addressLine2-error" className={errorBaseClasses}>
                      {errors.addressLine2[0]}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {" "}
                  <div className="relative">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={city || ""}
                      placeholder=" "
                      aria-invalid={errors.city ? "true" : "false"}
                      aria-describedby={errors.city ? "city-error" : undefined}
                      className={inputBaseClasses}
                      onChange={(e) => setCity(e.target.value)}
                    ></input>
                    <label htmlFor="city" className={labelBaseClasses}>
                      City
                    </label>
                    {errors.city && (
                      <p id="city-error" className={errorBaseClasses}>
                        {errors.city[0]}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={state || ""}
                      placeholder=" "
                      aria-invalid={errors.state ? "true" : "false"}
                      aria-describedby={
                        errors.state ? "state-error" : undefined
                      }
                      className={inputBaseClasses}
                      onChange={(e) => setState(e.target.value)}
                    ></input>
                    <label htmlFor="state" className={labelBaseClasses}>
                      State
                    </label>
                    {errors.state && (
                      <p id="state-error" className={errorBaseClasses}>
                        {errors.state[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="pincode"
                    name="pincode"
                    type="number"
                    value={pincode || ""}
                    placeholder=" "
                    aria-invalid={errors.pincode ? "true" : "false"}
                    aria-describedby={
                      errors.pincode ? "pincode-error" : undefined
                    }
                    className={inputBaseClasses + " " + hideSpinButtons}
                    onChange={(e) => setPincode(e.target.value)}
                  ></input>
                  <label htmlFor="pincode" className={labelBaseClasses}>
                    Pincode
                  </label>
                  {errors.pincode && (
                    <p id="pincode-error" className={errorBaseClasses}>
                      {errors.pincode[0]}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 py-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onClose()}
                    className={[
                      "font-label border-ink hover:bg-ink hover:text-paper btn-focus rounded-md border px-6 py-1.5",
                      loading ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSave()}
                    className={[
                      "font-label border-rose-gold-dark text-rose-gold-dark hover:bg-rose-gold-dark hover:text-paper btn-focus flex items-center justify-center gap-2 rounded-md border px-4 py-1.5",
                      loading ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    Save address
                    {loading && <Loader className="animate-spin" size={15} />}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
