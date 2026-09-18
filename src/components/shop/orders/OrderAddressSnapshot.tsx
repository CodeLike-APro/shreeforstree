import type { Address } from "@/types/models";

type ShippingAddress = Pick<
  Address,
  | "fullName"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "pincode"
  | "country"
>;

export default function OrderAddressSnapshot({
  address,
}: {
  address: ShippingAddress;
}) {
  return (
    <div className="font-label border-ink/10 flex w-full flex-col items-start justify-center gap-4 rounded-xl border p-4">
      <div>
        <p className="text-ink-40 text-xs leading-tight tracking-widest uppercase">
          Delivering to
        </p>
      </div>
      <div className="flex flex-col items-start gap-1">
        <h5 className="font-display text-lg font-semibold">
          {address.fullName}
        </h5>
        <p className="text-ink-55 text-sm">{address.phone}</p>
      </div>
      <div className="text-ink flex flex-col items-start text-base">
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        <p>
          {address.city}, {address.state}, {address.pincode}
        </p>
        <p>{address.country}</p>
      </div>
    </div>
  );
}
