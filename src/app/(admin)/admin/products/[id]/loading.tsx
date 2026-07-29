import { Shimmer } from "@/components/ui/Shimmer";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 flex flex-col gap-2 border-b border-ink-25 bg-paper px-6 py-3">
        <Shimmer className="h-8 w-72" />
        <Shimmer className="h-3 w-24" />
      </header>

      <div className="flex-1 px-6 py-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <Shimmer className="mb-4 h-4 w-32" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <section className="flex flex-col gap-5 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-2">
              <Shimmer className="h-7 w-32" />
              <Shimmer className="h-11 w-full" />
              <Shimmer className="h-11 w-full" />
              <Shimmer className="h-28 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Shimmer className="h-11 w-full" />
                <Shimmer className="h-11 w-full" />
              </div>
            </section>
            <section className="flex flex-col gap-4 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-1">
              <Shimmer className="h-7 w-28" />
              <Shimmer className="h-16 w-full" />
              <Shimmer className="h-16 w-full" />
              <Shimmer className="h-16 w-full" />
            </section>
            <section className="flex flex-col gap-4 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-3">
              <Shimmer className="h-7 w-24" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Shimmer className="aspect-square w-full" />
                <Shimmer className="aspect-square w-full" />
                <Shimmer className="aspect-square w-full" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
