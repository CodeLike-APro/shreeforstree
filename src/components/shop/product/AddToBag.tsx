"use client";
export default function AddToBag({
  size,
  quantity = 1,
  price,
}: {
  size: string;
  quantity: number;
  price: number;
}) {
  return (
    <div className="w-full">
      <button className="bg-ink text-paper font-label border-ink w-full rounded-sm border px-4 py-3 tracking-widest uppercase">
        {size ? (
          <p className="">
            Add to Bag - {quantity} &middot; {quantity * price}
          </p>
        ) : (
          <p className="">Select a size</p>
        )}
      </button>
    </div>
  );
}
