"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ title }: { title: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="btn-focus text-ink-55 flex items-center justify-around gap-2 rounded-lg px-1 py-0.5 text-sm tracking-widest uppercase"
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
