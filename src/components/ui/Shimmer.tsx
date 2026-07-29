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
    <div className="w-64 shrink-0 select-none">
      {/* Image — same footprint as the card's 3:4 media */}
      <Shimmer className="w-64 aspect-3/4" />

      {/* Title + price */}
      <div className="py-2">
        <div className="min-h-8 flex flex-col gap-2">
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
