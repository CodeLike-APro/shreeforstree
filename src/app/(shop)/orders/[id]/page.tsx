import OrderAddressSnapshot from "@/components/shop/orders/OrderAddressSnapshot";
import BackButton from "@/components/ui/BackButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { getOwnedOrder } from "@/lib/order-utils";
import { formatAmount, formatDate, orderReference } from "@/lib/orders";
import { X } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

export const metadata = {
  robots: {
    index: false,
  },
};

export default async function OrderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;

  const orderResponse = await getOwnedOrder({ orderId });

  if (orderResponse.kind !== "ok") {
    return notFound();
  }

  const { data: orderDetails } = orderResponse;

  if (!orderDetails) {
    return notFound();
  }

  const address = {
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
    <div className="px-8 py-10">
      <BackButton title="Orders" />
      <div>
        <div className="mt-7 flex items-center justify-start gap-2">
          <h1 className="font-label text-3xl">
            Order ID: {orderReference(orderDetails.id)}
          </h1>
          <p className="font-label rounded-md bg-blue-300 px-2 py-1 text-xs tracking-widest uppercase">
            {orderDetails.orderStatus}
          </p>
        </div>
        <div>
          <p className="text-ink-55 tracking-wide">
            Placed on {formatDate(orderDetails.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-7 flex items-start gap-4">
        <div className="border-ink/10 sticky top-32 flex w-full flex-col items-start rounded-2xl border">
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
        <div className="sticky top-32 flex w-[40%] flex-col gap-4">
          <div className="border-ink/10 w-full rounded-2xl border p-4">
            <div className="border-ink/10 flex flex-col gap-2 border-b pb-2">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Summary
              </h5>
              <div className="font-label mt-3 flex items-center justify-between text-base tracking-wide">
                <h6 className="text-ink-55">Items Total</h6>
                <p>{formatAmount(orderDetails.itemsTotal)}</p>
              </div>
              <div className="font-label flex items-center justify-between text-base tracking-wide">
                <h6 className="text-ink-55">Shipping</h6>
                <p>
                  {Number(orderDetails.shippingCharges) === 0
                    ? "Free"
                    : formatAmount(orderDetails.shippingCharges)}
                </p>
              </div>
            </div>
            <div className="font-label border-ink/10 mt-3 flex items-center justify-between border-b pb-3 tracking-wide">
              <h5>Total</h5>
              <p className="font-bold">
                {formatAmount(orderDetails.totalAmount)}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
                Payment
              </h5>
              <div className="font-label mt-3 flex items-center justify-between text-base tracking-wide">
                <h6 className="text-ink-55">Payment Method</h6>
                <p>{orderDetails.payments[0]?.method || "N/A"}</p>
              </div>
              <div className="font-label flex items-center justify-between text-base tracking-wide">
                <h6 className="text-ink-55">Payment Status</h6>
                <p>{orderDetails.payments[0]?.status || "N/A"}</p>
              </div>
              <div className="font-label flex items-center justify-between text-base tracking-wide">
                <h6 className="text-ink-55">Transaction ID</h6>
                <div className="flex items-center justify-center gap-2">
                  <p className="leading-tight">
                    {orderDetails.payments[0]?.transactionId || "N/A"}
                  </p>
                  {orderDetails.payments[0]?.transactionId && (
                    <div className="flex items-center justify-center">
                      <CopyButton
                        text={orderDetails.payments[0]?.transactionId || "N/A"}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <OrderAddressSnapshot address={address} />
          </div>
        </div>
      </div>
    </div>
  );
}
