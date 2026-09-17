"use client";

import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z4 from "zod/v4";
import AllAddresses from "@/components/shop/Addresses/AllAddresses";
import EmailShimmer, {
  OrderItemsShimmerGrid,
  PaymentSummaryShimmer,
} from "@/components/ui/Shimmer";
import { useSession } from "@/lib/auth-client";

import type { addresses } from "@/lib/db/schema";

type Address = typeof addresses.$inferSelect;

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

export default function Checkout() {
  const { data: session, isPending } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [cartItems, setCartItems] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState(isPending || email ? false : true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailLoading = isPending;
  const displayedEmail = email ?? session?.user.email ?? "";
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (editEmail) emailInputRef.current?.focus();
  }, [editEmail]);

  const handleEditEmail = () => setEditEmail(true);

  const handleSaveEmail = () => {
    setEmailError(null);
    const result = z4
      .email("Enter a valid email address")
      .safeParse(displayedEmail);
    if (!result.success) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEditEmail(false);
  };

  const fetchOrderItems = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        toast.error("Failed to fetch items");
        console.error("Failed to fetch items", res);
        setIsLoading(false);
        return;
      }

      const result = await res.json();

      if (!result.success) {
        toast.error("Failed to fetch items");
        console.error("Failed to fetch items", result);
        setIsLoading(false);
        return;
      }

      const data = result.data as Cart;
      setCartItems(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching items", error);
      toast.error("Failed to fetch items");
      setIsLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("cart:merged", fetchOrderItems);
    const load = async () => {
      await fetchOrderItems();
    };

    void load();
    return () => window.removeEventListener("cart:merged", fetchOrderItems);
  }, [fetchOrderItems]);

  const collapse = useCallback(() => setIsExpanded(false), []);

  const handlePlaceOrder = async () => {
    if (!displayedEmail) {
      setEmailError("Please provide a valid email address");
      handleEditEmail();
      return;
    }
    if (!selectedAddress) {
      toast.error("Please add a delivery address to place your order");
      return;
    }

    if (!cartItems || cartItems.items.length === 0) {
      toast.error("No items in your cart to place an order");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const orderData = {
        email: displayedEmail,
        ...(session && { addressId: selectedAddress.id }),
        shippingFullName: selectedAddress.fullName,
        shippingPhone: selectedAddress.phone,
        shippingAddressLine1: selectedAddress.addressLine1,
        shippingAddressLine2: selectedAddress.addressLine2,
        shippingCity: selectedAddress.city,
        shippingState: selectedAddress.state,
        shippingPincode: selectedAddress.pincode,
        shippingCountry: selectedAddress.country,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        setIsPlacingOrder(false);
        setOrderError("Failed to place order");
        const errorResponse = await res.json();
        console.error("Failed to place order", errorResponse);
        toast.error(errorResponse.message || "Failed to place order");
        return;
      }

      const result = await res.json();

      if (!result.success) {
        setIsPlacingOrder(false);
        setOrderError("Failed to place order");
        console.error("Failed to place order", result);
        toast.error(result.message || "Failed to place order");
        return;
      }

      const data = result.data;
      router.replace(`/checkout/${data.id}/payment`);
    } catch (error) {
      setIsPlacingOrder(false);
      setOrderError("Failed to place order");
      console.error("Error placing order", error);
      toast.error("Failed to place order");
    }
  };

  return (
    <div className="mt-10 flex min-h-screen w-full items-center justify-center gap-4 self-center px-10 pb-20">
      <div className="flex min-h-screen w-full max-w-7xl justify-center gap-10">
        <div className="flex w-full flex-col items-center gap-2 self-center">
          <div className="border-ink/10 flex w-full flex-col items-start justify-center gap-2 border-b pb-4">
            <h1 className="text-3xl font-bold tracking-wide">Checkout</h1>
            <p className="text-ink-40 font-label text-base">
              Confirm where this is going, then place your order.
            </p>
          </div>

          <div className="border-ink/10 my-7 flex w-full flex-col items-center justify-start border-b pb-7">
            <div className="flex w-full flex-col items-center justify-start gap-4">
              <div className="flex h-full w-full flex-col items-start justify-center">
                <h4 className="font-label w-full font-bold tracking-wide">
                  Email Address
                </h4>
                <p className="text-ink-55 font-label text-sm">
                  We need your email address to send you order updates.
                </p>
              </div>
              <div className="flex h-full w-full items-start justify-between self-start">
                {emailLoading ? (
                  <EmailShimmer />
                ) : (
                  <div className="flex h-full w-full items-center justify-between">
                    <div className="relative w-[60%]">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        ref={emailInputRef}
                        aria-invalid={emailError ? "true" : "false"}
                        aria-describedby={
                          emailError ? "email-error" : undefined
                        }
                        disabled={!editEmail}
                        value={displayedEmail}
                        placeholder=" "
                        className={[
                          "peer border-ink/35 font-label btn-focus h-9 w-full rounded-md border-[1.5] px-2 py-3 placeholder:text-sm",
                          editEmail
                            ? ""
                            : "bg-ink-10 text-ink-55 cursor-not-allowed",
                        ].join(" ")}
                        onChange={(e) => setEmail(e.target.value)}
                      ></input>

                      <label
                        htmlFor="email"
                        className="peer-focus:text-rose-gold-dark font-label bg-paper pointer-events-none absolute -top-2 left-2 px-1 text-xs font-medium text-gray-700 transition-all duration-300 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:text-sm peer-focus:translate-y-0 peer-focus:text-xs"
                      >
                        Email Address
                      </label>
                      {emailError && (
                        <p
                          id="email-error"
                          className="font-label mt-1 ml-1 text-sm text-red-500"
                        >
                          {emailError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex w-[20%] items-start justify-center">
                  <button
                    onClick={() => {
                      if (!editEmail) {
                        handleEditEmail();
                      } else {
                        handleSaveEmail();
                      }
                    }}
                    className="font-label border-ink bg-paper text-ink hover:bg-ink hover:text-paper btn-focus rounded-md border px-4 py-1.5 text-base"
                  >
                    {editEmail ? "Save" : "Edit Email"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex w-full flex-col items-center justify-between gap-2">
            <div className="flex h-10 w-full items-center justify-between">
              <h4 className="font-label font-bold tracking-wide">
                Delivery Address
              </h4>
              {!isExpanded && selectedAddress && (
                <button
                  onClick={() => !isExpanded && setIsExpanded(!isExpanded)}
                  className="font-label border-ink bg-paper text-ink hover:bg-ink hover:text-paper btn-focus rounded-md border px-4 py-1.5 text-base"
                >
                  Change Address
                </button>
              )}
            </div>
            <div className="w-full">
              <AllAddresses
                expand={isExpanded}
                onSelect={setSelectedAddress}
                onCollapse={collapse}
              />
            </div>
          </div>

          <div className="w-full">
            <div className="border-b-ink/10 flex h-10 w-full items-center justify-between border-b pb-3">
              <h4 className="font-label font-bold tracking-wide">
                Order Items
              </h4>
            </div>
            <div className="w-full py-5">
              {isLoading ? (
                <OrderItemsShimmerGrid count={3} />
              ) : !cartItems ? (
                <div className="flex w-full flex-col items-center justify-center gap-2">
                  <p className="font-label text-lg">
                    Something went wrong while fetching your items to order.
                  </p>
                </div>
              ) : cartItems.items.length === 0 ? (
                <div className="flex w-full flex-col items-center justify-center gap-2">
                  <p className="font-label text-lg">
                    No items in your cart to order.
                  </p>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-4">
                  {cartItems.items.map((item) => (
                    <div
                      key={item.id}
                      className="border-b-ink/10 flex h-full w-full items-center justify-start gap-4 border-b pb-4"
                    >
                      <div className="relative flex aspect-3/4 w-18 overflow-hidden rounded-lg">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          fill={true}
                          sizes="contain"
                          className="aspect-3/4 h-auto w-18 object-cover"
                        />
                      </div>
                      <div className="flex h-full flex-col items-start justify-between gap-6">
                        <div>
                          <div className="font-label flex items-center justify-center text-lg">
                            <h4 className="font-label font-bold">
                              {item.product.title}
                            </h4>
                          </div>
                          <div className="flex items-center justify-around gap-4">
                            <div className="font-label text-paper rounded-pill bg-ink flex items-center justify-center overflow-hidden px-2 py-1 text-sm leading-none font-semibold">
                              <p className="h-full w-full text-center">
                                {item.size}
                              </p>
                            </div>
                            <div className="font-label text-sm font-semibold uppercase">
                              <p className="h-full w-full text-center">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          {item.product.discountedPrice ? (
                            <div className="flex items-end justify-center gap-2">
                              <p className="font-labe h-full w-full text-lg font-bold">
                                &#8377;
                                {Number(item.product.discountedPrice) *
                                  Number(item.quantity)}
                              </p>
                              <p className="font-label text-ink-40 text-sm font-semibold line-through">
                                &#8377;
                                {Number(item.product.price) *
                                  Number(item.quantity)}
                              </p>
                              <p className="font-label rounded-pill bg-sage/10 text-sage px-1 py-0.5 text-xs font-semibold">
                                -
                                {Math.floor(
                                  ((Number(item.product.price) -
                                    Number(item.product.discountedPrice)) /
                                    Number(item.product.price)) *
                                    100,
                                )}
                                %
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p>
                                {Number(item.product.price) *
                                  Number(item.quantity)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex w-full flex-col items-center justify-center gap-6">
            <div className="stitch-divider h-0.5 w-full"></div>
            <div className="flex w-full flex-col items-start justify-center">
              <h6 className="font-serif-alt text-ink text-lg font-bold">
                Made to order
              </h6>
              <p className="font-serif-alt text-ink-55 font-semi-bold text-lg italic">
                Each piece is cut and finished after you order. We&apos;ll
                notify you once it ships.
              </p>
            </div>
          </div>
        </div>
        <div className="w-[40%]">
          {isLoading ? (
            <div className="sticky top-32 w-full">
              <PaymentSummaryShimmer />
            </div>
          ) : !cartItems ? (
            <div className="font-label border-ink/10 sticky top-32 w-full rounded-xl border px-4 py-2">
              <p>Something went wrong while loading items to order</p>
            </div>
          ) : cartItems.items.length === 0 ? (
            <div className="border-ink/10 bg-paper sticky top-32 flex w-full items-center justify-center gap-2 rounded-xl border p-4">
              <p className="font-label">
                There are no items to order in your cart.
              </p>
            </div>
          ) : (
            <div className="sticky top-32 w-full">
              <div className="border-ink/10 bg-paper flex w-full flex-col items-start justify-center gap-2 rounded-xl border">
                <div className="border-b-ink/10 flex w-full items-center justify-between border-b p-4 uppercase">
                  <h4 className="font-label text-ink-40 text-xs font-normal tracking-[0.2rem]">
                    Payment Summary
                  </h4>
                </div>
                <div className="font-label flex w-full flex-col items-start justify-center gap-2 px-4 py-2">
                  <div className="flex w-full items-center justify-between">
                    <h6 className="text-ink-55 font-normal">Price</h6>
                    <p>
                      &#8377;
                      {Number(cartItems.originalPriceTotal).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <h6 className="text-ink-55 font-normal">Discount</h6>
                    <p className="text-sage">
                      - &#8377;
                      {Number(cartItems.discountAmount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <h6 className="text-ink-55 font-normal">Subtotal</h6>
                    <p>
                      &#8377;
                      {Number(cartItems.discountedPriceTotal).toFixed(2)}
                    </p>
                  </div>
                  <div className="border-ink/10 flex w-full items-center justify-between border-b pb-4">
                    <h6 className="text-ink-55 font-normal">Shipping</h6>
                    <div>
                      {Number(cartItems.shippingCharge) === 0 ? (
                        <p>Free</p>
                      ) : (
                        <p>
                          &#8377;
                          {Number(cartItems.shippingCharge).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="font-label flex w-full items-center justify-between gap-4 px-4 pb-2">
                  <h6>Total</h6>
                  <p className="font-bold">
                    &#8377;
                    {Number(cartItems.total).toFixed(2)}
                  </p>
                </div>
                <div className="border-ink/10 flex w-full flex-col items-center justify-center border-b px-4 pb-4">
                  <button
                    disabled={isPlacingOrder}
                    onClick={handlePlaceOrder}
                    className={[
                      "btn-focus bg-rose-gold text-paper flex w-full items-center justify-center rounded-lg px-4 py-4 text-xs font-semibold tracking-widest uppercase",
                      isPlacingOrder ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    Place Order
                    {isPlacingOrder && (
                      <div className="ml-2 animate-spin">
                        <Loader size={17} />
                      </div>
                    )}
                  </button>
                  {orderError && (
                    <div className="font-label mt-1 ml-1 text-center text-red-500">
                      {orderError}
                    </div>
                  )}
                </div>

                <div className="font-label text-ink-55 flex w-full flex-col items-center justify-center gap-2 px-4 py-2 text-center font-normal">
                  <p>
                    Placing an order means you accept our{" "}
                    <Link
                      className="hover:text-ink shrink-0 cursor-pointer underline"
                      href="/terms-&-conditions"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      className="hover:text-ink shrink-0 cursor-pointer underline"
                      href="/privacy-policy"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
