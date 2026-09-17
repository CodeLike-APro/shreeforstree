"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";

export default function CartMerge() {
  const { data: session, isPending } = useSession();

  const inFlight = useRef(false);

  useEffect(() => {
    if (isPending || !session?.session.id || inFlight.current) return;

    const key = `cart-merged:${session?.session.id}`;

    try {
      if (sessionStorage.getItem(key)) return;
    } catch (error) {
      console.error("SessionStorage unavailable, merging anyway", error);
    }

    inFlight.current = true;

    const mergeCart = async () => {
      try {
        const res = await fetch("/api/cart/merge", {
          method: "POST",
        });

        if (!res.ok) {
          console.error("Failed to merge carts", await res.json());
          return;
        }

        const result = await res.json();

        if (!result.success) {
          console.error("Failed to merge carts", result);
          return;
        }

        if (result.data.merged) {
          window.dispatchEvent(new Event("cart:merged"));
        }

        try {
          sessionStorage.setItem(key, "true");
        } catch (error) {
          return console.error("Failed to set session storage", error);
        }
      } catch (error) {
        console.error("Failed to merge carts", error);
      } finally {
        inFlight.current = false;
      }
    };

    mergeCart();
  }, [isPending, session?.session.id]);

  return null;
}
