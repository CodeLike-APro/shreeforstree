import type { OrderStatus, PaymentStatus } from "@/types/models";

type OrderStatusColor = {
  status: OrderStatus;
  bgColor: string;
  textColor: string;
};
type PaymentStatusColor = {
  status: PaymentStatus;
  bgColor: string;
  textColor: string;
};

const baseClasses = "rounded-md px-2 py-1 text-xs tracking-widest uppercase";
const orderStatusColors: OrderStatusColor[] = [
  {
    status: "not_placed",
    bgColor: "bg-ink-15",
    textColor: "text-ink",
  },
  { status: "placed", bgColor: "bg-dusk/20", textColor: "text-dusk" },
  {
    status: "confirmed",
    bgColor: "bg-plum/20",
    textColor: "text-plum",
  },
  {
    status: "shipped",
    bgColor: "bg-terracotta/20",
    textColor: "text-terracotta",
  },
  { status: "delivered", bgColor: "bg-sage/20", textColor: "text-sage" },
  { status: "cancelled", bgColor: "bg-crimson/20", textColor: "text-crimson" },
  {
    status: "returned",
    bgColor: "bg-crimson-dark/20",
    textColor: "text-crimson-dark",
  },
];

const paymentStatusColors: PaymentStatusColor[] = [
  { status: "pending", bgColor: "bg-ink-15", textColor: "text-ink" },
  { status: "success", bgColor: "bg-sage/20", textColor: "text-sage" },
  {
    status: "refunded",
    bgColor: "bg-plum/20",
    textColor: "text-plum",
  },
  { status: "failed", bgColor: "bg-crimson/20", textColor: "text-crimson" },
  {
    status: "expired",
    bgColor: "bg-crimson-dark/20",
    textColor: "text-crimson-dark",
  },
];

export default function OrderStatusBadge({
  kind,
  status,
}:
  | {
      kind: "order";
      status: OrderStatus;
    }
  | {
      kind: "payment";
      status: PaymentStatus;
    }) {
  const correctStatus =
    kind === "order" && status.toLowerCase() === "not_placed"
      ? "not placed"
      : status.toLowerCase();
  return (
    <div>
      {kind === "order" && (
        <p
          className={`${baseClasses} ${
            orderStatusColors.find((s) => s.status === status)?.bgColor
          } ${orderStatusColors.find((s) => s.status === status)?.textColor}`}
        >
          {correctStatus}
        </p>
      )}

      {kind === "payment" && (
        <p
          className={`${baseClasses} ${
            paymentStatusColors.find((s) => s.status === status)?.bgColor
          } ${paymentStatusColors.find((s) => s.status === status)?.textColor}`}
        >
          {correctStatus}
        </p>
      )}
    </div>
  );
}
