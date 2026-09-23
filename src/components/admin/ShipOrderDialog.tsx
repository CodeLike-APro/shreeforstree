"use client";

import { Loader, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { OrderFieldErrors } from "@/types/api/orders";

const inputBaseClasses: string =
  "peer border-ink/35 font-label h-9 w-full rounded-md border-[1.5] px-2 py-3 placeholder:text-sm btn-focus";

const labelBaseClasses: string =
  "peer-focus:text-rose-gold-dark font-label bg-paper absolute -top-2 left-2 px-1 text-xs font-medium text-gray-700 transition-all duration-300 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:text-sm peer-focus:translate-y-0 peer-focus:text-xs pointer-events-none";

const focusableSelector: string =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

const errorBaseClasses: string = "font-label mt-1 text-sm text-red-600";

export default function ShipOrderDialog({
  open,
  loading,
  errors,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  errors: OrderFieldErrors;
  onCancel: () => void;
  onConfirm: (trackingNumber: string, estimatedDelivery: string | null) => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(
    null,
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";
    const handlePointer = (e: MouseEvent) => {
      if (loading) return;
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      onCancel();
    };

    const getFocusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((el) => el.getClientRects().length > 0) as HTMLElement[];

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (loading) return;
        onCancel();
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
      document.body.style.overflow = "";
    };
  }, [onCancel, open, loading]);

  if (!open) return null;

  return createPortal(
    <div className="bg-ink-40 fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipping-title"
        className="bg-paper relative flex w-full max-w-md flex-col gap-4 rounded-2xl p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="hover:bg-ink/10 btn-focus absolute top-3 right-3 rounded-full p-1.5 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={16} />
        </button>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h5 id="shipping-title" className="font-display text-lg font-bold">
              Mark this order shipped
            </h5>
            <p className="text-ink-55 leading-none">
              The tracking number goes to the customer, so enter it exactly as
              the shipping carrier gave it to you.
            </p>
          </div>
          <div className="relative flex flex-col gap-1">
            <input
              id="tracking-number"
              name="tracking-number"
              type="text"
              value={trackingNumber || ""}
              placeholder=" "
              aria-invalid={errors.trackingNumber ? "true" : "false"}
              aria-describedby={
                errors.trackingNumber ? "tracking-number-error" : undefined
              }
              className={inputBaseClasses}
              onChange={(e) => setTrackingNumber(e.target.value)}
            ></input>
            <label htmlFor="tracking-number" className={labelBaseClasses}>
              Tracking number
            </label>
            {errors.trackingNumber && (
              <p id="tracking-number-error" className={errorBaseClasses}>
                {errors.trackingNumber[0]}
              </p>
            )}
            <p className="text-ink-55">
              Each tracking number can only sit on one order.
            </p>
          </div>
          <div className="relative flex flex-col gap-1">
            <input
              id="estimated-delivery"
              name="estimated-delivery"
              type="date"
              value={estimatedDelivery || ""}
              placeholder=" "
              aria-invalid={errors.estimatedDelivery ? "true" : "false"}
              aria-describedby={
                errors.estimatedDelivery
                  ? "estimated-delivery-error"
                  : undefined
              }
              className={inputBaseClasses}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
            ></input>
            <label htmlFor="estimated-delivery" className={labelBaseClasses}>
              Estimated delivery
            </label>
            {errors.estimatedDelivery && (
              <p id="estimated-delivery-error" className={errorBaseClasses}>
                {errors.estimatedDelivery[0]}
              </p>
            )}
            <p className="text-ink-55">
              Optional. Leave it empty if you are not sure yet.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="border-ink btn-focus font-label hover:bg-ink hover:text-paper cursor-pointer rounded-md border px-2 py-1.5 text-base tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !trackingNumber?.trim()}
            onClick={() =>
              onConfirm(trackingNumber?.trim() ?? "", estimatedDelivery)
            }
            className="btn-focus font-label bg-rose-gold hover:bg-rose-gold-dark text-paper flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.75 text-base tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark shipped
            {loading && <Loader size={15} className="animate-spin" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
