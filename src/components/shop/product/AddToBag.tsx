"use client";
export default function AddToBag({
  size,
  quantity = 1,
  price,
}: {
  size: string;
  quantity: number | "";
  price: number;
}) {
  return (
    <div className="w-full">
      <button
        type="button"
        disabled={!size}
        className={[
          "bg-ink text-paper font-label border-ink w-full rounded-sm border px-4 py-3 tracking-widest uppercase",
          size ? "cursor-pointer" : "cursor-not-allowed",
        ].join(" ")}
      >
        {size ? (
          <p className="">
            Add to Bag - {typeof quantity === "number" ? quantity : 1} &middot;{" "}
            {typeof quantity === "number" ? quantity * price : price}
          </p>
        ) : (
          <p className="">Select a size</p>
        )}
      </button>
    </div>
  );
}
