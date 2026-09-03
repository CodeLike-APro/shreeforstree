"use client";

import AllAddresses from "@/components/shop/Addresses/AllAddresses";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
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

export default function Checkout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cartItems, setCartItems] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderItems = async () => {
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
    };

    fetchOrderItems();
  }, []);

  return (
    <div className="flex flex-col items-start gap-2 px-10 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-wide">Checkout</h1>
        <p className="text-ink-40 text-md font-label">
          Confirm where this is going, then place your order.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center justify-between gap-2">
        <div className="flex h-10 w-full items-center justify-between">
          <h4 className="font-label font-bold tracking-wide">
            Delivery Address
          </h4>
          {!isExpanded && (
            <button
              onClick={() => !isExpanded && setIsExpanded(!isExpanded)}
              className="font-label text-md border-ink bg-paper text-ink hover:bg-ink hover:text-paper btn-focus rounded-md border px-4 py-1.5"
            >
              Change Address
            </button>
          )}
        </div>
        <div className="w-full">
          <AllAddresses
            expand={isExpanded}
            onCollapse={() => setIsExpanded(false)}
          />
        </div>
      </div>

      <div className="w-full">
        <div className="border-b-ink/10 flex h-10 w-full items-center justify-between border-b pb-3">
          <h4 className="font-label font-bold tracking-wide">Order Items</h4>
        </div>
        <div className="w-full py-5">
          {isLoading ? (
            <div className="flex w-full flex-col items-center justify-center gap-2">
              <div className="animate-spin">
                <Loader size={20} />
              </div>
              <p className="font-label text-lg">
                Loading your items to order...
              </p>
            </div>
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
                            {Number(item.product.price) * Number(item.quantity)}
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
                            {Number(item.product.price) * Number(item.quantity)}
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
    </div>
  );
}
