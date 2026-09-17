"use client";
import { ChevronLeft, Loader } from "lucide-react";
import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleCopyToClipboard } from "@/lib/orders";

export function BackButton({ title }: { title: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="btn-focus text-ink-55 flex items-center justify-around gap-2 rounded-lg py-0.5 text-sm tracking-widest uppercase"
    >
      <div className="flex h-full w-full items-center justify-center">
        <ChevronLeft size={17} />
      </div>
      <p className="mt-1 flex h-full w-full items-center justify-center leading-tight">
        {title}
      </p>
    </button>
  );
}

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

type PrimaryButtonProps =
  | {
      title: string;
      onClick: () => void;
      disabled?: boolean;
      loading?: boolean;
      type?: "button" | "submit" | "reset";
      href?: never;
    }
  | {
      title: string;
      href: string;
      onClick?: never;
      disabled?: never;
      loading?: never;
      type?: never;
    };

const primaryButtonBaseClasses =
  "btn-focus bg-rose-gold text-paper hover:bg-rose-gold-dark w-full h-full disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center rounded-lg text-xs font-semibold tracking-widest uppercase";

export function PrimaryButton({
  title,
  onClick,
  disabled = false,
  loading = false,
  href,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <>
      {href && (
        <Link href={href} className={primaryButtonBaseClasses}>
          {title}
        </Link>
      )}
      {onClick && (
        <button
          disabled={disabled || loading}
          type={type}
          aria-busy={loading}
          onClick={onClick}
          className={primaryButtonBaseClasses}
        >
          {title}
          {loading && <Loader size={16} className="ml-2 animate-spin" />}
        </button>
      )}
    </>
  );
}

type SecondaryButtonProps =
  | {
      title: string;
      onClick: () => void;
      type?: "button" | "submit" | "reset";
      href?: never;
    }
  | {
      title: string;
      href: string;
      onClick?: never;
      type?: never;
    };

const secondaryButtonBaseClasses =
  "font-label border-ink bg-paper flex items-center justify-center text-ink hover:bg-ink w-full h-full hover:text-paper btn-focus rounded-md border text-base uppercase text-xs font-semibold tracking-widest";

export function SecondaryButton({
  title,
  onClick,
  type = "button",
  href,
}: SecondaryButtonProps) {
  return (
    <>
      {href && (
        <Link href={href} className={secondaryButtonBaseClasses}>
          {title}
        </Link>
      )}
      {onClick && (
        <button
          type={type}
          onClick={onClick}
          className={secondaryButtonBaseClasses}
        >
          {title}
        </button>
      )}
    </>
  );
}
