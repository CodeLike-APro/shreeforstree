"use client";

import { orderReference } from "@/lib/orders";
import { loadRazorpayCheckoutScript } from "@/lib/razorpay-checkout";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ApiResult } from "@/types/api";
import type { PaymentOrderData } from "@/types/api/payments";
import type { RazorpayOptions } from "@/types/razorpay";

export default function Payment() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params;
  const hasOpened = useRef(false);
  const rzpRef = useRef<{ close: () => void } | null>(null);
  const singleOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const confirmPage = `/checkout/${singleOrderId}/confirming`;

  useEffect(() => {
    if (hasOpened.current) return;
    hasOpened.current = true;

    if (!singleOrderId) {
      router.replace("/checkout");
      toast.error("Invalid order ID");
      return;
    }

    const createPaymentOrder = async () => {
      try {
        setFailureMessage(null);
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: singleOrderId }),
        });

        if (!res.ok) {
          console.error("Failed to create payment order", res);
          toast.error("Failed to create payment order");
          setFailureMessage("Failed to create payment order");
          hasOpened.current = false;
          return;
        }

        const result: ApiResult<PaymentOrderData> = await res.json();

        if (!result.success) {
          console.error("Failed to create payment order", result);
          toast.error("Failed to create payment order");
          setFailureMessage("Failed to create payment order");
          hasOpened.current = false;
          return;
        }

        const data = result.data;

        if (!data.razorpayOrderId) {
          router.replace(`/orders/${singleOrderId}/confirmation`);
          return;
        }

        await loadRazorpayCheckoutScript();

        if (!window.Razorpay) {
          console.error("Razorpay checkout script not loaded");
          toast.error("Razorpay checkout script not loaded");
          setFailureMessage("Razorpay checkout script not loaded");
          hasOpened.current = false;
          return;
        }

        const options: RazorpayOptions = {
          key: data.keyId,
          order_id: data.razorpayOrderId,
          amount: Math.round(Number(data.amount) * 100),
          currency: data.currency,
          name: "shreeforstree",
          description: `Order: ${orderReference(singleOrderId)}`,
          prefill: {
            name: data.name,
            email: data.email,
            contact: data.contact,
          },
          handler: async (response) => {
            try {
              await fetch(`/api/payments/confirm`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: singleOrderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
            } catch (error) {
              console.error("Error confirming payment", error);
              toast.error("Error confirming payment");
              setFailureMessage("Error confirming payment");
              hasOpened.current = false;
            }
            router.replace(confirmPage);
          },
          theme: { color: "#AD6D5E" },
          notes: { orderId: singleOrderId },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled. Your order is still waiting.");
              router.push("/checkout");
            },
            escape: true,
            confirm_close: true,
          },
        };

        const rzp = new window.Razorpay(options);
        rzpRef.current = rzp;
        rzp.on("payment.failed", (response) => {
          console.error("Payment failed", response);
          toast.error("Payment failed");
        });
        rzp.open();
      } catch (error) {
        console.error("Error creating order", error);
        toast.error("Error creating order");
        setFailureMessage("Error creating order");
        hasOpened.current = false;
      }
    };
    createPaymentOrder();
    return () => {
      rzpRef.current?.close();
      rzpRef.current = null;
    };
  }, [singleOrderId, router, confirmPage]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      {failureMessage ? (
        <div className="font-label flex flex-col items-center justify-between gap-5 rounded-lg p-4 text-lg">
          <div className="flex flex-col items-center">
            <p>{failureMessage}</p>
            <p>Nothing has been charged.</p>
          </div>
          <div className="flex w-[60%] flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="btn-focus bg-rose-gold hover:bg-rose-gold-dark text-paper w-full rounded-md px-2 py-4 text-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="font-label h-full text-center text-xl">
          <h1 className="font-display text-ink text-2xl leading-tight font-bold">
            Processing payment...
          </h1>
          <p className="text-ink-55 font-label mt-2 text-base">
            Please do not close this tab.
          </p>
        </div>
      )}
    </div>
  );
}
