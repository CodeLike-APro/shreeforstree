"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import QuantitySelector from "./product/QuantitySelector";
import { CartItemShimmerGrid } from "../ui/Shimmer";
import { RazorpayIcon } from "../ui/icon";
import { MAX_CART_ITEMS } from "@/lib/constants";
import { toast } from "sonner";

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

export default function Cart({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [cartError, setCartError] = useState<null | string>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [draftQty, setDraftQty] = useState<Record<string, number | "">>({});

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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

  // Debounce Quantity Change.
  // Refresh Cart Items after removing.
  // Fix lint.

  const refreshCart = useCallback(
    async ({ silent = false }: { silent?: boolean }) => {
      try {
        setLoading(!silent);
        setCartError(null);
        const res = await fetch("/api/cart");
        if (!res.ok) {
          setCartError(`Failed to load cart items. Please try again later.`);
          return;
        }
        const result = await res.json();
        if (!result.success) {
          setCartError(`Failed to load cart items. Please try again later.`);
          return;
        }
        const cartItems = result.data as Cart;
        setCart(cartItems);
        console.log("Cart Items:-", cartItems);
      } catch (error) {
        console.error(`Cart Error:- ${error}`);
        setCartError(`Failed to load cart items. Please try again later.`);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCart({ silent: false });
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
        return;
      }
      const result = await updateItems.json();
      if (!result.success) {
        toast.error("Failed to update quantity. Please try again later.");
        return;
      }
    } catch (error) {
      console.error(`Update Quantity Error:- ${error}`);
    }
  };

  const handleQuantityChange = async (itemId: string, next: number | "") => {
    setDraftQty((prev) => ({ ...prev, [itemId]: next }));
    if (next === "") {
      setDraftQty((prev) => ({ ...prev, [itemId]: next }));
      return;
    }
    if (next < 1) {
      setDraftQty((prev) => ({ ...prev, [itemId]: 1 }));
      toast.info(`Minimum quantity allowed is 1.`);
      return;
    }
    if (next > MAX_CART_ITEMS) {
      setDraftQty((prev) => ({ ...prev, [itemId]: MAX_CART_ITEMS }));
      toast.info(`Maximum quantity allowed is ${MAX_CART_ITEMS}.`);
      return;
    }
    await updateQuantity(itemId, next);
    refreshCart({ silent: true });
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setRemoveId(itemId);
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setCartError(
          `Failed to remove item from cart. Please try again later.`,
        );
        return;
      }
      const result = await res.json();
      if (!result.success) {
        setCartError(
          `Failed to remove item from cart. Please try again later.`,
        );
        return;
      }

      setCart((prevCart) => {
        if (!prevCart) return prevCart;
        const updatedItems = prevCart.items.filter(
          (item) => item.id !== itemId,
        );
        return { ...prevCart, items: updatedItems };
      });
    } catch (error) {
      console.error(`Remove Item Error:- ${error}`);
      setCartError(`Failed to remove item from cart. Please try again later.`);
    } finally {
      setRemoveId(null);
    }
  };

  return (
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
              "bg-paper fixed inset-y-0 right-0 z-50 min-h-screen w-[40%] max-w-105 min-w-[320px]"
            }
          >
            <div className="border-ink/10 flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-ink text-xl">Your bag</h3>
              <button
                ref={triggerRef}
                onClick={onClose}
                className="bg-paper text-ink hover:bg-ink hover:text-paper border-ink-25 z-40 flex cursor-pointer rounded-full border p-2 backdrop-blur-sm transition-colors duration-150"
              >
                <X size={17} />
              </button>
            </div>
            <div className="px-5">
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
                              disabled={removeId !== null}
                              onClick={() => handleRemoveItem(item.id)}
                              className={[
                                "text-ink-40 text-label text-xs tracking-tight",
                                removeId !== null
                                  ? "cursor-not-allowed"
                                  : "hover:text-ink hover:underline",
                              ].join(" ")}
                            >
                              {removeId !== null ? "Removing..." : "Remove"}
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
                      <div className="border-ink/10 font-display text-md mt-2 flex items-center justify-between border-t py-2 font-bold">
                        <h6>Total</h6>
                        <p>{cart.total}</p>
                      </div>
                      <button className="bg-ink text-paper font-label rounded-md py-3 text-xs font-semibold tracking-widest uppercase">
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
                  <p>No items in the cart</p>
                )
              ) : cartError ? (
                <>
                  <p className="text-ink">
                    Error occurred while fetching cart data
                  </p>
                </>
              ) : (
                <p className="text-ink">No cart data available</p>
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
            className="bg-ink-40 absolute inset-0 z-40 min-h-screen w-full backdrop-blur-sm"
          ></motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
