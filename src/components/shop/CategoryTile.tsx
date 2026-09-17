import { MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { HomeData } from "@/lib/queries/home";

type CategoryTileProps = {
  category: HomeData["categories"][number];
  variant?: "feature" | "default";
  className?: string;
  sizes: string;
};

export default function CategoryTile({
  category,
  variant = "default",
  className,
  sizes,
}: CategoryTileProps) {
  const isFeature = variant === "feature";
  const inset = isFeature
    ? "right-6 bottom-7 left-6"
    : "right-5 bottom-6 left-5";

  const titleSize = isFeature ? "text-2xl md:text-3xl" : "text-xl md:text-2xl";

  return (
    <Link
      href={`/shop?categories=${category.slug}`}
      className={`group bg-blush btn-focus relative block overflow-hidden rounded-sm ${className ?? ""}`}
    >
      {category.categoryImageUrl && (
        <Image
          fill
          src={category.categoryImageUrl}
          sizes={sizes}
          alt=""
          className="object-cover transition-transform duration-800 ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}

      {/* base scrim — fades out on hover */}
      <div className="from-ink/80 via-ink/20 absolute inset-0 bg-linear-to-t to-transparent transition-opacity duration-800 group-hover:opacity-0 group-focus-visible:opacity-0" />
      {/* hover scrim — deeper, fades in */}
      <div className="from-ink/95 via-ink/40 absolute inset-0 bg-linear-to-t to-transparent opacity-0 transition-opacity duration-800 group-hover:opacity-100 group-focus-visible:opacity-100" />

      <div className={`absolute ${inset}`}>
        <div className="relative flex flex-col transition-transform duration-800 ease-out group-hover:-translate-y-3 group-focus-visible:-translate-y-3 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-visible:translate-y-0">
          <p className={`font-display text-paper font-bold ${titleSize}`}>
            {category.title}
          </p>
          <div className="absolute top-full left-0 mt-1 flex translate-y-2 items-center gap-1 opacity-0 transition-all duration-800 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none">
            <span className="label-caps text-blush text-[0.65rem]">
              View collection
            </span>
            <span className="text-blush transition-transform delay-75 duration-800 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none">
              <MoveRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
