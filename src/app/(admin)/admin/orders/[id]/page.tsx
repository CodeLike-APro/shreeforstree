import { X } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import z4 from "zod/v4";
import OrderTracker from "@/components/admin/OrderTracker";
import { BackButton } from "@/components/ui/Buttons";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { db } from "@/lib/db";
import { formatAmount, formatDate, orderReference } from "@/lib/orders";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = z4.uuid().safeParse(id);
  if (!parsed.success) return notFound();

  const orderDetails = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.id, id),
    with: {
      orderItems: true,
      payments: { orderBy: (payments, { desc }) => [desc(payments.createdAt)] },
    },
  });
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
    <div className="p-4">
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
      <div className="flex flex-col items-center justify-center gap-4">
        <OrderTracker orderId={orderDetails.id} status="confirmed" />
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
      </div>
    </div>
  );
}
