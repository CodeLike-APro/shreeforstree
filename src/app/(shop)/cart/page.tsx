"use client";
import { useRouter } from "next/navigation";
import Cart from "@/components/shop/Cart";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center text-center">
      <Cart
        isOpen={true}
        onClose={() => {
          if (window.history.length <= 1) {
            router.push("/");
            return;
          }
          router.back();
        }}
      />
    </div>
  );
}
