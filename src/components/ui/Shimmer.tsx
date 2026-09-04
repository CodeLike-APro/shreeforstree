/**
 * Loading shimmers (skeletons).
 *
 * `Shimmer` is the primitive — a grey block with a light sweep (the `.shimmer`
 * utility + keyframes live in globals.css). Compose it into shaped skeletons
 * like `CardShimmer`, which mirrors the layout of <Card /> in @/utils/card.
 */

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className = "" }: ShimmerProps) {
  return <div className={`shimmer rounded-sm ${className}`} />;
}

/** Placeholder that matches a single product/category card. */
export function CardShimmer() {
  return (
    <div className="w-full shrink-0 select-none sm:w-64">
      {/* Image — same footprint as the card's 3:4 media */}
      <Shimmer className="aspect-3/4 w-full sm:w-64" />

      {/* Title + price */}
      <div className="py-2">
        <div className="flex min-h-8 flex-col gap-2">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

/** A row of card placeholders — `count` defaults to 8. */
export function CardShimmerGrid({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardShimmer key={i} />
      ))}
    </>
  );
}

export function CartItemShimmer() {
  return (
    <>
      <div className="flex items-center gap-4 py-3">
        <Shimmer className="aspect-3/4 w-15" />
        <div className="flex w-full flex-1 flex-col gap-2">
          <Shimmer className="h-4 w-3/5" />
          <div className="flex items-center justify-between gap-2">
            <Shimmer className="h-3 w-1/4" />
            <Shimmer className="h-3 w-1/4" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Shimmer className="h-3 w-1/4" />
            <Shimmer className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    </>
  );
}

export function CartItemShimmerGrid({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CartItemShimmer key={i} />
      ))}
    </>
  );
}

export function AddressShimmer() {
  return (
    <div className="border-ink/10 flex w-full gap-2 rounded-xl border p-4">
      <div className="flex h-full w-[40%] flex-col gap-5">
        <div className="flex gap-2">
          <Shimmer className="h-5 w-1/4" />
          <Shimmer className="h-5 w-1/4" />
        </div>
        <div className="flex flex-col gap-2">
          <Shimmer className="h-7 w-1/2" />
          <Shimmer className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex w-[60%] flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function OrderItemsShimmer() {
  return (
    <div className="border-b-ink/10 flex gap-4 border-b pb-4">
      <div className="bg-red overflow-hidden rounded-xl">
        <Shimmer className="aspect-3/4 w-18" />
      </div>
      <div className="flex w-[80%] flex-col items-start justify-between">
        <div className="flex w-full flex-col gap-2">
          <div className="w-[50%]">
            <Shimmer className="h-6 w-full" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <Shimmer className="h-5 w-12" />
            </div>
            <div>
              <Shimmer className="h-5 w-12" />
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <Shimmer className="h-5 w-15" />
          </div>
          <div>
            <Shimmer className="h-5 w-10" />
          </div>
          <div>
            <Shimmer className="h-5 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderItemsShimmerGrid({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <OrderItemsShimmer key={i} />
      ))}
    </>
  );
}

export function PaymentSummaryShimmer() {
  return (
    <div className="border-ink/10 bg-paper flex w-full flex-col items-start justify-center gap-2 rounded-xl border">
      <div className="border-b-ink/10 flex w-full items-center justify-between border-b p-4 uppercase">
        <h4 className="font-label text-ink-40 text-xs font-normal tracking-[0.2rem]">
          Payment Summary
        </h4>
      </div>
      <div className="font-label flex w-full flex-col items-start justify-center gap-2 px-4 py-2">
        <div className="flex w-full items-center justify-between">
          <h6 className="text-ink-55 font-normal">Price</h6>
          <Shimmer className="h-5 w-25" />
        </div>
        <div className="flex w-full items-center justify-between">
          <h6 className="text-ink-55 font-normal">Discount</h6>
          <Shimmer className="h-5 w-25" />
        </div>
        <div className="flex w-full items-center justify-between">
          <h6 className="text-ink-55 font-normal">Subtotal</h6>
          <Shimmer className="h-5 w-25" />
        </div>
        <div className="border-ink/10 flex w-full items-center justify-between border-b pb-4">
          <h6 className="text-ink-55 font-normal">Shipping</h6>
          <Shimmer className="h-5 w-25" />
        </div>
      </div>
      <div className="font-label flex w-full items-center justify-between gap-4 px-4 pb-2">
        <h6>Total</h6>
        <div className="font-bold">
          <Shimmer className="h-5 w-25" />
        </div>
      </div>
      <div className="border-ink/10 flex w-full items-center justify-center border-b px-4 pb-4">
        <div className="w-full overflow-hidden rounded-lg">
          <Shimmer className="h-10 w-full" />
        </div>
      </div>
      <div className="font-label text-ink-55 flex w-full flex-col items-center justify-center gap-2 px-4 py-3 text-center font-normal">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-full" />
      </div>
    </div>
  );
}

export default function EmailShimmer() {
  return (
    <div className="border-ink/35 h-9 w-[60%] rounded-lg border-[1.5] px-2 py-1.5">
      <Shimmer className="h-full w-3/4" />
    </div>
  );
}
