"use client";

import { handleCopyToClipboard } from "@/lib/orders";
import { Copy } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="btn-focus text-ink-55 hover:bg-ink/10 flex items-center justify-center rounded-sm p-1"
      onClick={() => handleCopyToClipboard(text)}
    >
      <Copy size={14} />
    </button>
  );
}
