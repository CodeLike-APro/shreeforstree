import { Shimmer } from "@/components/ui/Shimmer";

export default function Loading() {
  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <header className="border-ink-25 bg-paper sticky top-0 z-40 flex flex-col gap-2 border-b px-6 py-3">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-8 w-64" />
        <Shimmer className="h-3 w-24" />
      </header>

      <div className="flex-1 px-6 py-6 pb-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <section className="border-ink-40 bg-paper flex flex-col gap-6 rounded-xl border p-6 shadow-sm md:col-span-2">
            <Shimmer className="h-7 w-48" />
            <div className="flex flex-col gap-2">
              <Shimmer className="h-3 w-16" />
              <Shimmer className="h-11 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Shimmer className="h-3 w-16" />
              <Shimmer className="h-11 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-32 w-full" />
            </div>
            <Shimmer className="h-16 w-full" />
          </section>

          <section className="border-ink-40 bg-paper flex h-fit flex-col gap-8 rounded-xl border p-6 shadow-sm md:col-span-1">
            <div className="flex flex-col gap-4">
              <Shimmer className="h-7 w-40" />
              <Shimmer className="aspect-video w-full" />
            </div>
            <div className="flex flex-col gap-4">
              <Shimmer className="h-7 w-32" />
              <Shimmer className="aspect-video w-full" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
