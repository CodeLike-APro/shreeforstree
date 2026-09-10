"use client";

import { Handbag, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import QuantitySelector from "./product/QuantitySelector";
import { CartItemShimmerGrid } from "../ui/Shimmer";
import { RazorpayIcon } from "../ui/icon";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Cart = {
  cartId: string;
  items: {
    product: {
      title: string;
      price: string;
      discountedPrice: string | null;
      imageUrl: string;
      isActive: boolean;
    };
    id: string;
    cartId: string;
    size: string;
    updatedAt: Date;
    productId: string;
    quantity: number;
  }[];
  originalPriceTotal: string;
  discountedPriceTotal: string;
  shippingCharge: string;
  discountAmount: string;
  amountToFreeShipping: string;
  total: string;
};

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const focusableSelector: string =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export default function Cart({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const qtyTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const prefersReducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Cart | null>(null);
  const [draftQty, setDraftQty] = useState<Record<string, number | "">>({});
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const getFocusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((el) => el.getClientRects().length > 0) as HTMLElement[];

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
    };
  }, [onClose, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fix lint.

  const refreshCart = useCallback(async () => {
    try {
      const refreshSeq = ++seqRef.current;
      const res = await fetch("/api/cart");
      if (refreshSeq !== seqRef.current) {
        return;
      }
      if (!res.ok) {
        toast.error(`Failed to load cart items. Please try again later.`);
        setLoading(false);
        return;
      }
      const result = await res.json();
      if (!result.success) {
        toast.error(`Failed to load cart items. Please try again later.`);
        setLoading(false);
        return;
      }
      const cartItems = result.data as Cart;
      setCart(cartItems);
      setLoading(false);
    } catch (error) {
      console.error(`Cart Error:- ${error}`);
      toast.error(`Failed to load cart items. Please try again later.`);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCart = async () => {
      return await refreshCart();
    };

    fetchCart();
  }, [isOpen, refreshCart]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const updateItems = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: quantity }),
      });

      if (!updateItems.ok) {
        toast.error("Failed to update quantity. Please try again later.");
        return false;
      }
      const result = await updateItems.json();
      if (!result.success) {
        toast.error("Failed to update quantity. Please try again later.");
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Update Quantity Error:- ${error}`);
      toast.error("Failed to update quantity. Please try again later.");
      return false;
    }
  };

  const handleQuantityChange = (itemId: string, next: number | "") => {
    setDraftQty((prev) => ({ ...prev, [itemId]: next }));
    if (next === "") {
      return;
    }

    const final = Math.min(Math.max(next, 1), MAX_CART_ITEMS);

    if (final !== next) {
      setDraftQty((prev) => ({ ...prev, [itemId]: final }));
    }

    const timers = qtyTimers.current;
    clearTimeout(timers.get(itemId));

    const timer = setTimeout(async () => {
      timers.delete(itemId);
      const updated = await updateQuantity(itemId, final);
      if (!updated) {
        setDraftQty((prev) => {
          const updatedDraft = { ...prev };
          delete updatedDraft[itemId];
          return updatedDraft;
        });
      }
      await refreshCart();
    }, 400);

    timers.set(itemId, timer);
  };

  useEffect(() => {
    const timers = qtyTimers.current;

    const clear = () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
    return clear;
  }, []);

  const handleRemoveItem = async (itemId: string) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(itemId));
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(`Failed to remove item from cart. Please try again later.`);
        return;
      }
      const result = await res.json();
      if (!result.success) {
        toast.error(`Failed to remove item from cart. Please try again later.`);
        return;
      }

      await refreshCart();

      setCart((prevCart) => {
        if (!prevCart) return prevCart;
        const updatedItems = prevCart.items.filter(
          (item) => item.id !== itemId,
        );
        return { ...prevCart, items: updatedItems };
      });
    } catch (error) {
      console.error(`Remove Item Error:- ${error}`);
      toast.error(`Failed to remove item from cart. Please try again later.`);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const mounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0, x: 0 }
                : { opacity: 0, x: 150 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0, x: 0 }
                : { opacity: 0, x: 150 }
            }
            transition={{ duration: 0.2 }}
            ref={panelRef}
            className={
              "bg-paper fixed inset-y-0 right-0 z-70 min-h-screen w-[40%] max-w-105 min-w-[320px]"
            }
          >
            <div className="border-ink/10 flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-ink text-xl">Your bag</h3>
              <button
                onClick={onClose}
                className="bg-paper text-ink hover:bg-ink hover:text-paper border-ink-25 btn-focus z-40 flex cursor-pointer rounded-full border p-2 backdrop-blur-sm transition-colors duration-150"
              >
                <X size={17} />
              </button>
            </div>
            <div className="h-full px-5">
              {loading ? (
                <CartItemShimmerGrid count={3} />
              ) : cart ? (
                cart.items.length > 0 ? (
                  <>
                    {cart.items.map((item) => (
                      <ul
                        className="border-ink/10 flex items-center gap-4 border-b py-3"
                        key={item.id}
                      >
                        <div className="relative aspect-3/4 w-15 overflow-hidden rounded-md">
                          <Image
                            className="aspect-3/4 h-auto w-full rounded-md object-cover"
                            fill={true}
                            src={item.product.imageUrl}
                            alt={item.product.title}
                          />
                        </div>
                        <div className="flex w-full flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-0.5">
                              <h6 className="text-ink font-display text-sm font-semibold tracking-wide">
                                {item.product.title}
                              </h6>
                              <p className="text-paper bg-ink rounded-pill self-start px-2 py-0.5 text-xs font-semibold">
                                {item.size}
                              </p>
                            </div>
                            <button
                              disabled={removingIds.has(item.id)}
                              onClick={() => handleRemoveItem(item.id)}
                              className={[
                                "text-ink-40 text-label btn-focus rounded-md px-2 py-0.5 text-xs tracking-tight",
                                removingIds.has(item.id)
                                  ? "cursor-not-allowed"
                                  : "hover:text-ink hover:underline",
                              ].join(" ")}
                            >
                              {removingIds.has(item.id)
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex">
                              <QuantitySelector
                                size="sm"
                                quantity={draftQty[item.id] ?? item.quantity}
                                onQuantityChange={(next) =>
                                  handleQuantityChange(item.id, next)
                                }
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-end gap-1">
                                <p className="text-ink-55 text-[0.7rem]">
                                  &#8377;{item.product.discountedPrice} each
                                </p>
                                <p className="text-ink-40 text-[0.65rem] line-through">
                                  &#8377;{item.product.price}
                                </p>
                              </div>
                              <div className="text-ink font-display text-lg font-semibold">
                                &#8377;
                                {Number(item.quantity) *
                                  (item.product.discountedPrice
                                    ? Number(item.product.discountedPrice)
                                    : Number(item.product.price))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ul>
                    ))}

                    <div className="border-ink/10 absolute bottom-0 left-0 flex w-full flex-col border-t px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h6 className="text-ink-55 text-sm">Subtotal</h6>
                        <p className="text-ink font-label text-sm font-semibold">
                          &#8377;
                          {cart.discountedPriceTotal ?? cart.originalPriceTotal}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <h6 className="text-ink-55 text-sm">Shipping</h6>
                        <div className="text-ink font-label text-sm font-semibold">
                          {Number(cart.shippingCharge) > 0 ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <p>&#8377;{cart.shippingCharge}</p>
                              <p className="text-rust text-xs font-semibold tracking-wide">
                                &#8377;{cart.amountToFreeShipping} away from
                                free shipping
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <p>Free</p>
                              <p className="text-sage font-label text-xs font-semibold tracking-wider">
                                Shipping is on us
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border-ink/10 font-display mt-2 flex items-center justify-between border-t py-2 text-base font-bold">
                        <h6>Total</h6>
                        <p>{cart.total}</p>
                      </div>
                      <button
                        onClick={() => {
                          router.push("/checkout");
                          onClose();
                        }}
                        className="bg-ink text-paper font-label btn-focus rounded-md py-3 text-xs font-semibold tracking-widest uppercase"
                      >
                        Checkout
                      </button>
                      <div className="flex items-center justify-center gap-1 pt-2">
                        <p className="text-ink-55 font-label text-[0.6rem] tracking-widest uppercase">
                          secured by
                        </p>
                        <RazorpayIcon
                          className="mb-1"
                          width="55"
                          height="auto"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-10">
                    <div className="bg-blush flex items-center justify-center rounded-full p-4">
                      {" "}
                      <Handbag size={30} strokeWidth={1.7} />
                    </div>
                    <h4 className="font-display text-xl">Your bag is empty</h4>
                    <p className="font-label text-ink-40 text-center text-base">
                      Nothing chosen yet. The pieces you all will wait for you
                      here.
                    </p>
                    <button className="bg-paper text-rose-gold font-label border-rose-gold hover:bg-rose-gold-dark hover:text-paper hover:border-rose-gold-dark rounded-md border px-4 py-2 text-[0.7rem] font-semibold tracking-[0.2rem] uppercase transition-colors duration-150">
                      Browse the shop
                    </button>
                  </div>
                )
              ) : (
                <div className="text-in font-label flex h-full items-center justify-center tracking-widest">
                  No cart data available
                </div>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            onClick={onClose}
            className="bg-ink-40 fixed inset-0 z-60 backdrop-blur-lg"
          ></motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
