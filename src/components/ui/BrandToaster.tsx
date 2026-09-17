"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

/**
 * Sonner toaster themed to the shreeforstree brand:
 * paper surface, ink text, rose-gold accents, sage/rust for status.
 * Mounted once in the root layout — call `toast()` from anywhere.
 */
export default function BrandToaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={16}
      gap={10}
      icons={{
        success: <CheckCircle2 size={18} className="text-sage" />,
        error: <XCircle size={18} className="text-rust" />,
        info: <Info size={18} className="text-rose-gold" />,
        warning: <AlertTriangle size={18} className="text-rose-gold-dark" />,
        loading: <Loader2 size={18} className="text-rose-gold animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-paper !text-ink !border !border-ink-15 !rounded-xl !shadow-card !font-body !gap-3 !items-center",
          title: "!font-body !font-bold !text-ink !text-sm",
          description: "!font-body !text-ink-55 !text-xs",
          actionButton:
            "!bg-rose-gold hover:!bg-rose-gold-dark !text-paper !rounded-lg !font-label !text-xs !font-bold",
          cancelButton:
            "!bg-ink-08 !text-ink !rounded-lg !font-label !text-xs !font-bold",
          closeButton: "!bg-paper !text-ink !border !border-ink-15",
        },
      }}
    />
  );
}
