import { SquareArrowOutUpRight } from "lucide-react";
import { CopyButton } from "@/components/ui/Buttons";
import { formatDate } from "@/lib/orders";

import type { Order } from "@/types/models";

type ShippingAddress = Pick<
  Order,
  | "shippingFullName"
  | "shippingPhone"
  | "shippingAddressLine1"
  | "shippingAddressLine2"
  | "shippingCity"
  | "shippingState"
  | "shippingPincode"
  | "shippingCountry"
> &
  Partial<Pick<Order, "trackingNumber" | "estimatedDelivery">>;

export default function OrderAddressSnapshot({
  address,
}: {
  address: ShippingAddress;
}) {
  return (
    <div className="font-label border-ink/10 flex w-full flex-col items-start justify-center rounded-xl border">
      <div className="border-ink/10 w-full border-b p-4">
        <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
          Delivering to
        </h5>
      </div>

      <div
        className={[
          "w-full p-4",
          address.trackingNumber && "border-ink/10 border-b",
        ].join(" ")}
      >
        <div className="flex flex-col items-start gap-1">
          <h5 className="font-display text-lg font-semibold">
            {address.shippingFullName}
          </h5>
          <a
            href={`tel:${address.shippingPhone}`}
            className="text-ink-55 font-label flex gap-2 text-sm tracking-wide"
          >
            {address.shippingPhone}
          </a>
        </div>
        <div className="text-ink flex flex-col items-start text-base">
          <p>{address.shippingAddressLine1}</p>
          {address.shippingAddressLine2 && (
            <p>{address.shippingAddressLine2}</p>
          )}
          <p>
            {address.shippingCity}, {address.shippingState},{" "}
            {address.shippingPincode}
          </p>
          <p>{address.shippingCountry}</p>
        </div>
      </div>

      {address.trackingNumber && (
        <>
          <div className="border-ink/10 w-full border-b p-4">
            <h5 className="font-label text-ink-55 text-xs tracking-widest uppercase">
              Tracking number
            </h5>
          </div>
          <div className="flex w-full flex-col gap-4 p-4">
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full items-center gap-4">
                <p className="bg-ink/5 text-ink flex h-10 w-full items-center justify-start rounded-md p-4 font-mono text-sm">
                  {address.trackingNumber}
                </p>
                <CopyButton text={address.trackingNumber} />
              </div>
              {address.estimatedDelivery && (
                <p>
                  Estimated delivery {formatDate(address.estimatedDelivery)}
                </p>
              )}
            </div>
            <div>
              <a
                href="https://www.indiapost.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-gold hover:text-rose-gold-dark flex cursor-pointer gap-2 select-none hover:underline"
              >
                Track here{" "}
                <span>
                  <SquareArrowOutUpRight size={14} className="mt-1" />
                </span>
              </a>
              <p className="text-ink-40 text-sm">
                Paste your tracking number into the tracking box on their site.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
