"use client";

import { useEffect, useEffectEvent, useRef } from "react";

const focusableSelector =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function useDialogShell({
  open,
  loading,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const close = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!open) return;
    initialFocusRef.current?.focus();
    document.body.style.overflow = "hidden";
    const handlePointer = (e: MouseEvent) => {
      if (loading) return;
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    const getFocusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((el) => el.getClientRects().length > 0) as HTMLElement[];

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (loading) return;
        close();
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
  }, [open, loading]);

  return { panelRef, initialFocusRef };
}
