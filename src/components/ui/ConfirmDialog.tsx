"use client";

import { Loader, TriangleAlert } from "lucide-react";
import DialogShell from "./DialogShell";

export default function ConfirmDialog({
  open,
  title,
  description,
  warning,
  cancelLabel,
  confirmLabel,
  confirmVariant,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  warning?: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant: "rust" | "ink";
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const variant =
    confirmVariant === "rust"
      ? "bg-rust hover:bg-rust/90"
      : "bg-ink hover:bg-ink/90";

  return (
    <DialogShell<HTMLButtonElement>
      open={open}
      loading={loading}
      onClose={onCancel}
      labelledBy="confirm-title"
      aria-describedby="confirm-description"
    >
      {({ initialFocusRef }) => (
        <>
          <div>
            <h2 id="confirm-title" className="text-lg tracking-wide">
              {title}
            </h2>
            <p id="confirm-description" className="text-ink-55">
              {description}
            </p>
          </div>
          {warning && (
            <div className="bg-rust/10 border-rust/70 text-rust flex gap-3 rounded-xl border p-4">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <p>{warning}</p>
            </div>
          )}
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              ref={initialFocusRef}
              onClick={onCancel}
              disabled={loading}
              className="border-ink btn-focus font-label hover:bg-ink hover:text-paper cursor-pointer rounded-md border px-2 py-1.5 text-base transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`btn-focus font-label text-paper flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.75 text-base transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variant}`}
            >
              {confirmLabel}

              {loading && <Loader size={15} className="animate-spin" />}
            </button>
          </div>
        </>
      )}
    </DialogShell>
  );
}
