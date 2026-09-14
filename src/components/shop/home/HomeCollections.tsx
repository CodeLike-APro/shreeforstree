import type { HomeData } from "@/lib/queries/home";
import CategoryTile from "../CategoryTile";
import Link from "next/link";
import { MoveRight } from "lucide-react";

export default function HomeCollections({
  categories,
}: {
  categories: HomeData["categories"];
}) {
  const [feature, ...others] = categories;
  const rest = others.slice(0, 3);
  const columns =
    rest.length >= 3
      ? "md:grid-cols-3"
      : rest.length >= 1
        ? "md:grid-cols-2"
        : "md:grid-cols-1";

  return (
    <section className="mx-auto max-w-full px-4 py-16 md:px-8 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4 md:mb-11">
        <div>
          <p className="label-caps text-rose-gold text-xs">
            <span className="block md:inline">
              {categories.length >= 4
                ? "Four collections,"
                : "Every collection,"}
            </span>{" "}
            <span className="block md:inline">one thread</span>
          </p>
          <h2 className="font-display text-ink mt-3 text-3xl leading-tight font-bold md:text-5xl">
            Tailored for every occasion
          </h2>
        </div>
        <Link
          href="/collections"
          className="label-caps btn-focus group text-ink relative flex shrink-0 gap-2 rounded-sm px-1 py-1 text-xs transition-opacity hover:opacity-70"
        >
          View the edit
          <span>
            <MoveRight size={14} />
          </span>
          <div className="bg-rose-gold r-0 absolute bottom-0 left-0 h-0.5 w-full group-focus:hidden" />
        </Link>
      </div>

      <div
        className={`${columns} grid grid-cols-2 gap-4 md:auto-rows-60 md:gap-5`}
      >
        <CategoryTile
          category={feature}
          variant="feature"
          className="aspect-3/4 md:row-span-2 md:aspect-auto"
          sizes="(min-width: 768px) 33vw, 50vw"
        />

        {rest.map((category, index) => (
          <CategoryTile
            key={category.id}
            category={category}
            className={[
              "aspect-3/4 md:aspect-auto",
              rest.length === 1 && "md:row-span-2",
              rest.length === 3 && index === 2 && "md:col-span-2",
            ]
              .filter(Boolean)
              .join(" ")}
            sizes={
              rest.length === 3 && index === 2
                ? "(min-width: 768px) 66vw, 50vw"
                : "(min-width: 768px) 33vw, 50vw"
            }
          />
        ))}
      </div>
    </section>
  );
}
