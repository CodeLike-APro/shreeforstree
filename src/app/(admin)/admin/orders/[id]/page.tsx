import { Check, Mail, Phone, SquareArrowOutUpRight, X } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import z4 from "zod/v4";
import OrderTracker from "@/components/admin/OrderTracker";
import RefundBanner from "@/components/admin/RefundBanner";
import { BackButton, CopyButton } from "@/components/ui/Buttons";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { db } from "@/lib/db";
import { formatAmount, formatDate, orderReference } from "@/lib/orders";

import type { OrderDetail } from "@/types/api/orders";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = z4.uuid().safeParse(id);
  if (!parsed.success) return notFound();

  const orderDetails: OrderDetail | undefined = await db.query.orders.findFirst(
    {
      where: (orders, { eq }) => eq(orders.id, id),
      with: {
        orderItems: true,
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
        },
      },
    },
  );
  if (!orderDetails) return notFound();

  const _address = {
    fullName: orderDetails.shippingFullName,
    phone: orderDetails.shippingPhone,
    addressLine1: orderDetails.shippingAddressLine1,
    addressLine2: orderDetails.shippingAddressLine2,
    city: orderDetails.shippingCity,
    state: orderDetails.shippingState,
    pincode: orderDetails.shippingPincode,
    country: orderDetails.shippingCountry,
  };
  return (
    <div className="p-6">
      <BackButton title="Orders" />
      <div>
        <div className="mt-4 flex items-center justify-start gap-2">
          <h1 className="font-label text-3xl">
            Order ID: {orderReference(orderDetails.id)}
          </h1>
          <OrderStatusBadge kind="order" status={orderDetails.orderStatus} />
          <OrderStatusBadge
            kind="payment"
            status={orderDetails.paymentStatus}
          />
        </div>
        <div>
          <p className="text-ink-55 tracking-wide">
            Placed on {formatDate(orderDetails.createdAt)}
          </p>
        </div>
      </div>
      {orderDetails.refundRequired && (
        <div className="mt-4">
          <RefundBanner
            orderId={orderDetails.id}
            razorpayPaymentId={
              orderDetails.payments.find((p) => p.status === "success")
                ?.transactionId ?? null
            }
          />
        </div>
      )}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="sticky top-23 flex w-full flex-col items-center justify-center gap-4">
          <OrderTracker
            orderId={orderDetails.id}
            orderStatus={orderDetails.orderStatus}
            paymentStatus={orderDetails.paymentStatus}
          />
          <div className="border-ink/10 flex w-full flex-col items-start rounded-2xl border">
            <div className="border-ink/10 w-full border-b p-4">
              <h5 className="font-label text-ink-55 w-full text-xs tracking-widest uppercase">
                {orderDetails.orderItems.length !== 1 ? "items" : "item"}
              </h5>
            </div>
            <div className="flex w-full flex-col items-start justify-start gap-4 py-4">
              {orderDetails.orderItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={[
                    "flex w-full items-center justify-start gap-4 px-4",
                    idx === orderDetails.orderItems.length - 1
                      ? ""
                      : "border-ink/10 border-b pb-4",
                  ].join(" ")}
                >
                  <div className="overflow-hidden rounded-md">
                    <Image
                      src={item.productImageUrl}
                      alt={item.productTitle}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="aspect-3/4 w-16 object-cover"
                    />
                  </div>
                  <div className="flex h-full w-full flex-col items-start justify-around gap-1">
                    <div className="font-label flex w-full items-center justify-between font-bold">
                      <h5>{item.productTitle}</h5>
                      <p className="font-bold">
                        {formatAmount(
                          (
                            Number(item.priceAtPurchase) * item.quantity
                          ).toString(),
                        )}
                      </p>
                    </div>
                    <div className="rounded-pill bg-ink flex items-center justify-center px-2 py-1">
                      <p className="text-paper font-semi-bold mt-px text-center text-xs leading-tight">
                        {item.size}
                      </p>
                    </div>
                    <div className="font-label text-ink-55 flex items-center justify-center gap-1">
                      <div className="text-ink-55 text-sm">
                        Qty: {item.quantity}
                      </div>
                      <X size={14} />
                      <div className="text-ink-55 text-sm">
                        {formatAmount(item.priceAtPurchase)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-4 md:w-120">
          <div className="border-ink/10 rounded-xl border">
            <div className="border-ink/10 border-b p-4">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Contact
              </h5>
            </div>
            <div className="flex flex-col items-start justify-center gap-3 p-4">
              <h6 className="font-display text-lg font-bold">
                {orderDetails.shippingFullName}
              </h6>
              <div>
                <a
                  href={`tel:${orderDetails.shippingPhone}`}
                  className="text-ink-55 font-label flex gap-2 tracking-wide"
                >
                  <span>
                    <Phone size={13} className="mt-0.75" />
                  </span>
                  {orderDetails.shippingPhone}
                </a>
                <a
                  href={`mailto:${orderDetails.shippingEmail}`}
                  className="text-ink-55 font-label flex gap-2 tracking-wide"
                >
                  <span>
                    <Mail size={13} className="mt-1.25" />
                  </span>
                  {orderDetails.shippingEmail}
                </a>
              </div>
            </div>
          </div>
          <div className="font-label border-ink/10 flex w-full flex-col items-start justify-center rounded-xl border">
            <div className="border-ink/10 w-full border-b p-4">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Delivering to
              </h5>
            </div>

            <div className="border-ink/10 w-full border-b p-4">
              <div className="flex flex-col items-start gap-1">
                <h5 className="font-display text-lg font-semibold">
                  {orderDetails.shippingFullName}
                </h5>
                <a
                  href={`tel:${orderDetails.shippingPhone}`}
                  className="text-ink-55 font-label flex gap-2 text-sm tracking-wide"
                >
                  {orderDetails.shippingPhone}
                </a>
              </div>
              <div className="text-ink flex flex-col items-start text-base">
                <p>{orderDetails.shippingAddressLine1}</p>
                {orderDetails.shippingAddressLine2 && (
                  <p>{orderDetails.shippingAddressLine2}</p>
                )}
                <p>
                  {orderDetails.shippingCity}, {orderDetails.shippingState},{" "}
                  {orderDetails.shippingPincode}
                </p>
                <p>{orderDetails.shippingCountry}</p>
              </div>
            </div>

            <div className="border-ink/10 w-full border-b p-4">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Tracking number
              </h5>
            </div>
            <div className="flex w-full flex-col gap-4 p-4">
              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full items-center gap-4">
                  <p className="bg-ink/5 text-ink flex h-10 w-full items-center justify-start rounded-md p-4 font-mono text-sm">
                    Tracking no.
                  </p>
                  <CopyButton text="Tracking no." />
                </div>
                <p>Estimated delivery 2 Oct 2026</p>
              </div>
              <div>
                <a className="text-rose-gold hover:text-rose-gold-dark flex cursor-pointer gap-2 select-none hover:underline">
                  Track here{" "}
                  <span>
                    <SquareArrowOutUpRight size={14} className="mt-1" />
                  </span>
                </a>
                <p className="text-ink-40 text-sm">
                  Paste your tracking number into the tracking box on their
                  site.
                </p>
              </div>
            </div>
          </div>
          <div className="font-label border-ink/10 flex w-full flex-col items-start justify-center rounded-xl border">
            <div className="border-ink/10 w-full border-b p-4">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Payment
              </h5>
            </div>
            <div className="border-ink/10 flex w-full flex-col gap-2 border-b p-4">
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Status</h6>
                <p>{orderDetails.payments[0].status}</p>
              </div>
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Method</h6>
                <p>{orderDetails.payments[0].method}</p>
              </div>
              <div className="flex w-full items-start justify-between">
                <h6 className="text-ink-55">Transaction ID</h6>
                {orderDetails.payments[0].transactionId && (
                  <div className="flex flex-col items-end">
                    <p className="flex gap-2">
                      {orderDetails.payments[0].transactionId}
                      <span>
                        <CopyButton
                          text={orderDetails.payments[0].transactionId}
                        />
                      </span>
                    </p>
                    <a
                      href={`https://dashboard.razorpay.com/app/payments/${orderDetails.payments[0].transactionId}`}
                      className="font-label text-rose-gold hover:text-rose-gold-dark mr-1 flex gap-3 text-sm hover:underline"
                    >
                      Open in Razorpay
                      <span>
                        <SquareArrowOutUpRight size={13} className="mt-0.75" />
                      </span>
                    </a>
                  </div>
                )}
              </div>
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Razorpay order ID</h6>
                <p>{orderDetails.payments[0].razorpayOrderId}</p>
              </div>
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Amount</h6>
                <p>{orderDetails.payments[0].amount}</p>
              </div>
            </div>
            <div className="flex gap-3 p-4">
              <Check size={15} className="text-sage mt-1" />
              <p className="text-ink-55">
                Refunded in Razorpay and recorded here on{" "}
                <span className="text-ink font-semibold">16 Sept 2026</span>.
              </p>
            </div>
          </div>
          <div className="font-label border-ink/10 flex w-full flex-col items-start justify-center rounded-xl border">
            <div className="border-ink/10 w-full border-b p-4">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Money
              </h5>
            </div>
            <div className="border-ink/10 flex w-full flex-col gap-2 border-b p-4">
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Original</h6>
                <p>{formatAmount(orderDetails.originalAmount)}</p>
              </div>
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Discount</h6>
                <p>-{formatAmount(orderDetails.discountAmount)}</p>
              </div>
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Items total</h6>
                <p>{formatAmount(orderDetails.itemsTotal)}</p>
              </div>
              <div className="flex w-full items-center justify-between">
                <h6 className="text-ink-55">Shipping</h6>
                <p>{formatAmount(orderDetails.shippingCharges)}</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between p-4">
              <h6>Total</h6>
              <p className="font-bold">
                {formatAmount(orderDetails.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
