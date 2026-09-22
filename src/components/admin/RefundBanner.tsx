"use client";

import { SquareArrowOutUpRight, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import type { ApiResult } from "@/types/api";
import type { Order } from "@/types/models";

const REFUND_DIALOG = {
  title: "Record this refund?",
  description: "This only writes the refund down. It does not move any money.",
  cancelLabel: "Not yet",
  confirmLabel: "Record refund",
  confirmVariant: "ink",
} as const;

const REFUND_WARNING =
  "Refund the customer in the Razorpay dashboard first. Only record it here once that has actually gone through, the payment will be marked refunded and the reminder will disappear.";

export default function RefundBanner({
  orderId,
  razorpayPaymentId,
}: {
  orderId: string;
  razorpayPaymentId: string | null;
}) {
  const router = useRouter();
  const dashboardUrl = razorpayPaymentId
    ? `https://dashboard.razorpay.com/app/payments/${razorpayPaymentId}`
    : "https://dashboard.razorpay.com/app/payments";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  async function recordRefund() {
    setRefunding(true);

    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const result: ApiResult<Order> = await res.json();

      if (!result.success) {
        toast.error(result.message);
        if (res.status === 409) {
          router.refresh();
        }
        return;
      }

      toast.success("Refund recorded");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong, please try again");
      console.error(error);
    } finally {
      setRefunding(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={dialogOpen}
        {...REFUND_DIALOG}
        warning={REFUND_WARNING}
        loading={refunding}
        onCancel={() => setDialogOpen(false)}
        onConfirm={async () => {
          await recordRefund();
          setDialogOpen(false);
        }}
      />
      <div className="border-rust/50 bg-rust/5 w-full rounded-xl border p-4">
        <div className="border-ink/10 flex gap-2 border-b pb-4">
          <TriangleAlert size={16} className="text-rust mt-0.75 shrink-0" />
          <div>
            <h6 className="font-label text-rust font-semibold">
              Refund still to be issued
            </h6>
            <p className="text-ink-55">
              This order was paid for and then stopped. Issue the refund in the
              Razorpay dashboard, nothing was refunded automatically.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={dashboardUrl}
            className="font-label text-rust flex gap-2 hover:underline"
          >
            Refund in Razorpay dashboard
            <span>
              <SquareArrowOutUpRight size={15} className="mt-0.75" />
            </span>
          </a>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="bg-ink text-paper font-label hover:bg-ink/90 btn-focus cursor-pointer rounded-md px-4 py-2"
          >
            Record refund
          </button>
        </div>
      </div>
    </>
  );
}
