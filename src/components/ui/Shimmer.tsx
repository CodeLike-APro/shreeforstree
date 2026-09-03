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
