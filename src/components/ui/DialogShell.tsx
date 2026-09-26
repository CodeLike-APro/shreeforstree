"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useDialogShell } from "@/hooks/useDialogShell";

export default function DialogShell<T extends HTMLElement = HTMLElement>({
  open,
  loading,
  onClose,
  labelledBy,
  describedBy,
  children,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy: string;
  children: (refs: {
    initialFocusRef: React.RefObject<T | null>;
  }) => React.ReactNode;
}) {
  const { panelRef, initialFocusRef } = useDialogShell<T>({
    open,
    loading,
    onClose,
  });

  if (!open) return null;

  return createPortal(
    <div className="bg-ink-40 fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="bg-paper relative flex w-full max-w-md flex-col gap-4 rounded-2xl p-6"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="hover:bg-ink/10 btn-focus absolute top-3 right-3 rounded-full p-1.5 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={16} />
        </button>
        {children({ initialFocusRef })}
      </div>
    </div>,
    document.body,
  );
}
