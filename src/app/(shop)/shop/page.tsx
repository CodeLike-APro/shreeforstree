import ProductGrid from "@/components/shop/ProductGridTest";
import getProducts from "@/lib/queries/products";

interface PageProps {
  searchParams: Promise<{
    slug?: string;
    fabric?: string;
    silhouette?: string;
    sleeveType?: string;
    work?: string;
    categories?: string;
    isNewArrival?: string;
    isHeroProduct?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const slug = resolvedParams.slug;
  const fabric = resolvedParams.fabric;
  const silhouette = resolvedParams.silhouette;
  const sleeveType = resolvedParams.sleeveType;
  const work = resolvedParams.work;
  const category = resolvedParams.categories;
  const isNewArrival = resolvedParams.isNewArrival;
  const isHeroProduct = resolvedParams.isHeroProduct;
  const search = resolvedParams.search;
  const page = Math.max(1, parseInt(resolvedParams.page ?? "1") || 1);
  const limit = Math.max(1, parseInt(resolvedParams.limit ?? "10") || 10);
  const { allProducts } = await getProducts({
    slug,
    fabric,
    silhouette,
    sleeveType,
    work,
    category,
    isNewArrival,
    isHeroProduct,
    search,
    page,
    limit,
    isAdmin: false,
  });

  return (
    <div className="flex min-h-screen w-full flex-col px-8 pt-20">
      <div className="flex flex-col gap-4 text-start">
        <p className="font-label text-rose-gold text-sm tracking-widest uppercase">
          One piece, made once
        </p>
        <h1 className="font-display md:text-ink text-4xl font-bold md:text-6xl">
          All Pieces
        </h1>
        <p className="font-serif-alt text-ink-55 text-xl whitespace-break-spaces italic">
          Every piece below is made to order, cut to your measure,
          hand-finished, {"\n"} and sent out only when it&apos;s right.
        </p>
      </div>

      <div>
        <ProductGrid allProducts={allProducts} />
      </div>
    </div>
  );
}
