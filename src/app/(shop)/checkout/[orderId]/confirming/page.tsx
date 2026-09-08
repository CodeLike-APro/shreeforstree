"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ConfirmingOrder() {
  const params = useParams();
  const { orderId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<
    "pending" | "success" | "failed" | "refunded" | null
  >(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [timeOut, setTimeOut] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, []);

  const confirmOrder = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (!orderId) {
        console.error("No order ID provided");
        setErrorMessage("No order ID provided");
        toast.error("No order ID provided");
        return;
      }
      setIsLoading(true);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch order status");
        setErrorMessage("Failed to fetch order status");
        toast.error("Failed to fetch order status");
        setIsLoading(false);
        return;
      }

      const result = await res.json();

      if (!result.success) {
        console.error("Failed to fetch order status:", result.message);
        setErrorMessage(result.message || "Failed to fetch order status");
        toast.error(result.message || "Failed to fetch order status");
        setIsLoading(false);
        return;
      }

      const data = result.data;
      setOrderStatus(data.status);
      setFailureReason(data.failureReason);
      setIsLoading(false);
      return data.status;
    } catch (error) {
      console.error("Error confirming order:", error);
      setErrorMessage("Error confirming order");
      toast.error("Error confirming order");
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const fetchStatus = async function pollOrderStatus() {
      const delay = Date.now() - startTimeRef.current! < 20000 ? 2000 : 6000;
      const status = await confirmOrder();
      if (cancelledRef.current) return;
      if (status && status !== "pending") return;
      if (Date.now() - startTimeRef.current! >= 60_000) {
        setTimeOut(true);
        return;
      }
      timeoutRef.current = setTimeout(pollOrderStatus, delay);
    };
    cancelledRef.current = false;
    void fetchStatus();
    return () => {
      cancelledRef.current = true;
      clearTimeout(timeoutRef.current!);
    };
  }, [confirmOrder]);

  return (
    <div>
      {orderStatus === "success" ? (
        <div>Order confirmed successfully!</div>
      ) : orderStatus === "failed" ? (
        <div>{failureReason}</div>
      ) : orderStatus === "refunded" ? (
        <div>Order refunded.</div>
      ) : timeOut ? (
        <div>
          <p>
            Your order confirmation is taking longer than usual, we&apos;ll
            email you once it&apos;s confirmed.
          </p>
          <Link href="/">Continue Shopping</Link>
        </div>
      ) : errorMessage ? (
        <div>{errorMessage}</div>
      ) : (
        <p>
          {isLoading
            ? "Loading your order status..."
            : "Fetching order status..."}
        </p>
      )}
    </div>
  );
}
