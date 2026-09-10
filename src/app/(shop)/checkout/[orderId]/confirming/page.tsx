"use client";

import { Check, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ConfirmingOrder() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params;
  const [orderStatus, setOrderStatus] = useState<
    "pending" | "success" | "failed" | "refunded" | null
  >(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [timeOut, setTimeOut] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const navigatedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion() === true;

  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const fetchOrderImages = async () => {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          console.error("Failed to fetch order images");
          return;
        }
        const data = await res.json();
        setImageUrls(
          data.data.orderItems
            .map((item: { productImageUrl: string }) => item.productImageUrl)
            .filter(Boolean),
        );
      } catch (error) {
        console.error("Error fetching order images:", error);
      }
    };
    void fetchOrderImages();
  }, [orderId]);

  const confirmOrder = useCallback(async () => {
    try {
      if (!orderId) {
        console.error("No order ID provided");
        toast.error("No order ID provided");
        return;
      }
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch order status");
        return;
      }

      const result = await res.json();

      if (!result.success) {
        console.error("Failed to fetch order status:", result.message);
        return;
      }

      const data = result.data;
      setOrderStatus(data.status);
      setFailureReason(data.failureReason);
      return data.status;
    } catch (error) {
      console.error("Error confirming order:", error);
      toast.error("Error confirming order");
    }
  }, [orderId]);

  useEffect(() => {
    const fetchStatus = async function pollOrderStatus() {
      const delay = Date.now() - startTimeRef.current! < 20000 ? 2000 : 6000;
      const status = await confirmOrder();
      if (cancelledRef.current) return;
      if (navigatedRef.current) return;
      if (status === "success") {
        navigatedRef.current = true;
        router.replace(`/orders/${orderId}/confirmation`);
        return;
      }
      if (status && status !== "pending") return;
      if (Date.now() - startTimeRef.current! >= 60_000) {
        setTimeOut(true);
        return;
      }
      timeoutRef.current = setTimeout(pollOrderStatus, delay);
    };
    cancelledRef.current = false;
    navigatedRef.current = false;
    void fetchStatus();
    return () => {
      cancelledRef.current = true;
      navigatedRef.current = true;
      clearTimeout(timeoutRef.current!);
    };
  }, [confirmOrder, orderId, router]);

  const outcome =
    timeOut && (!orderStatus || orderStatus === "pending")
      ? "timeOut"
      : (orderStatus ?? "pending");

  return (
    <div className="font-label flex min-h-[80vh] flex-col items-center justify-center text-center text-xl">
      <Stage
        outcome={outcome}
        image={imageUrls}
        prefersReducedMotion={prefersReducedMotion}
      />

      <div className="mt-10">
        {outcome === "pending" && (
          <Message
            title="Processing payment"
            body={`Holding on while your bank confirms the payment. This usually takes a few seconds, please do not close this tab.`}
          />
        )}
        {outcome === "success" && (
          <Message
            title="Payment Received"
            body={`Your payment was successful. Thank you for your purchase.`}
          />
        )}
        {outcome === "failed" && (
          <Message
            title="Payment failed"
            body={
              failureReason ??
              `We're sorry, but your payment failed. Any amount debited will be refunded in 2-3 business days.`
            }
          />
        )}
        {outcome === "refunded" && (
          <Message
            title="Payment refunded"
            body={`Your payment has been refunded. If you have any questions, please contact support.`}
          />
        )}
        {outcome === "timeOut" && (
          <>
            <Message
              title="Still confirming"
              body={`Your bank is taking longer than usual. We'll email you once the payment is confirmed.`}
            />
            <Link
              href={"/orders"}
              className="font-label btn-focus border-ink bg-paper hover:bg-ink hover:text-paper mt-6 inline-flex h-12 items-center justify-center rounded-md border px-8 text-xs font-semibold tracking-widest uppercase transition-colors duration-150"
            >
              View your orders
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

type MessageProps = {
  title: string;
  body: string;
};

function Message({ title, body }: MessageProps) {
  return (
    <div aria-live="polite">
      <h1 className="font-display text-ink text-2xl leading-tight font-bold">
        {title}
      </h1>
      <p className="text-ink-55 mt-2 text-sm">{body}</p>
    </div>
  );
}

type StageProps = {
  outcome: "pending" | "success" | "failed" | "refunded" | "timeOut";
  image: string[];
  prefersReducedMotion: boolean;
};

function Stage({ outcome, image, prefersReducedMotion }: StageProps) {
  const isResolved =
    outcome === "success" || outcome === "failed" || outcome === "refunded";

  return (
    <div className="bg-blush ring-ink-08 relative size-40 overflow-hidden rounded-full ring-1">
      <AnimatePresence>
        {!isResolved && (
          <motion.div
            key="carousel"
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
            }}
            className="absolute inset-0"
          >
            <Carousel
              images={image}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isResolved && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", bounce: 0.35, duration: 0.6, delay: 0.3 }
            }
            className={[
              "absolute inset-0 flex items-center justify-center",
              outcome === "success" && "bg-sage/15",
              outcome === "failed" && "bg-rust/10",
              outcome === "refunded" && "bg-ink-05",
            ].join(" ")}
          >
            {outcome === "success" && (
              <Check
                size={56}
                strokeWidth={1.5}
                className="text-sage"
                aria-hidden="true"
              />
            )}
            {outcome === "failed" && (
              <X
                size={56}
                strokeWidth={1.5}
                className="text-rust"
                aria-hidden="true"
              />
            )}
            {outcome === "refunded" && (
              <RefreshCw
                size={56}
                strokeWidth={1.5}
                className="text-ink-40"
                aria-hidden="true"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type CarouselProps = {
  images: string[];
  prefersReducedMotion: boolean;
};

function Carousel({ images, prefersReducedMotion }: CarouselProps) {
  const [postion, setPosition] = useState(0);

  useEffect(() => {
    if (images.length < 2 || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setPosition((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length, prefersReducedMotion]);

  if (images.length === 0) {
    return (
      <motion.div
        animate={
          prefersReducedMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }
        }
        transition={{
          duration: 2.6,
          repeat: Infinity,
        }}
        className="bg-rose-gold/20 size-full"
      ></motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.img
        key={postion}
        src={images[postion]}
        alt=""
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.55, scale: 1 }}
        exit={{ opacity: 0, scale: 1.08 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 1.4,
        }}
        className="absolute inset-0 size-full object-cover grayscale-35"
      />
    </AnimatePresence>
  );
}
