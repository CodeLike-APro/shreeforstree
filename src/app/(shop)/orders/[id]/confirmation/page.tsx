import { notFound, redirect } from "next/navigation";
import OrderAddressSnapshot from "@/components/shop/orders/OrderAddressSnapshot";
import OrderItemThumbnail from "@/components/shop/orders/OrderItemThumbnail";
import SuccessMark from "@/components/shop/orders/SuccessMark";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { getOwnedOrder } from "@/lib/order-utils";
import { formatAmount, itemCount, orderReference } from "@/lib/orders";

export const metadata = {
  robots: {
    index: false,
  },
};

export default async function ConfirmationPage({
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

  if (!(
    orderDetails.orderStatus === "placed" &&
    orderDetails.paymentStatus === "success" &&
    orderDetails.payments[0]?.status === "success"
  )) {
    return redirect(`/orders/${orderId}`);
  }

  const items: { url: string; title?: string }[] | null =
    orderDetails.orderItems?.map((item) => ({
      url: item.productImageUrl,
      title: item.productTitle,
    }));

  return (
    <div className="flex items-center justify-center px-8 py-20">
      <div className="flex w-[40%] max-w-4xl flex-col items-center justify-center gap-7">
        <div className="flex flex-col items-center justify-center gap-7">
          <SuccessMark />
          <div className="flex flex-col items-center justify-center gap-3">
            <h1 className="text-4xl">Thank you</h1>
            <p className="text-ink-55 text-base tracking-wide">
              Order {orderReference(orderDetails.id)} is placed
            </p>
          </div>
          <div className="flex flex-col items-center justify-center leading-tight">
            <p className="text-ink-55 text-base tracking-wide">
              Each piece is cut and finished after you order.
            </p>
            <p className="text-ink-55 text-base tracking-wide">
              We&apos;ll notify you once it ships.
            </p>
          </div>
        </div>
        <div className="w-full">
          <div className="flex flex-col gap-4">
            <div className="border-ink/10 rounded-2xl border p-4">
              <h5 className="font-label text-ink-55 w-full text-xs leading-none tracking-widest uppercase">
                Your Order
              </h5>
              <div className="border-ink/10 mt-3 flex w-full items-center justify-between border-b pb-1">
                <div className="flex items-center justify-start gap-4">
                  <OrderItemThumbnail items={items} />
                  <p className="text-ink-55 text-start leading-tight">
                    {itemCount(orderDetails.orderItems.length)}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-center gap-1">
                  <h5 className="font-label text-ink-40 text-xs leading-none font-semibold tracking-widest uppercase">
                    Total paid
                  </h5>
                  <p className="text-ink text-start text-sm leading-tight font-bold">
                    {formatAmount(orderDetails.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex w-full items-center justify-between gap-4">
                <div className="flex items-center justify-start gap-0.5">
                  <h6 className="font-label text-ink-55 mt-0.5 text-base leading-none tracking-wide">
                    Transaction ID
                  </h6>
                  <span className="font-label text-ink-55 text-base leading-none tracking-wide">
                    :
                  </span>
                </div>
                <p className="text-ink text-start text-sm leading-tight">
                  {orderDetails.payments[0]?.transactionId ?? "N/A"}
                </p>
              </div>
            </div>
            <div>
              <OrderAddressSnapshot address={orderDetails} />
            </div>
          </div>
        </div>
        <div className="flex h-12 w-[75%] items-center justify-center gap-4">
          <div className="flex h-full w-[40%] items-center justify-center gap-4">
            <PrimaryButton
              title="View Order"
              href={`/orders/${orderDetails.id}`}
            />
          </div>
          <div className="flex h-full w-[55%] items-center justify-center gap-4">
            <SecondaryButton title="Continue Shopping" href="/" />
          </div>
        </div>
      </div>
    </div>
  );
}
