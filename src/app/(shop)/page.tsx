import AtelierEdit from "@/components/shop/home/AtelierEdit";
import HomeCollections from "@/components/shop/home/HomeCollections";
import HomeHero from "@/components/shop/home/HomeHero";
import HomeMarquee from "@/components/shop/home/HomeMarquee";
import HomePromise from "@/components/shop/home/HomePromise";
import HomeSignature from "@/components/shop/home/HomeSignature";
import NewArrivalsRail from "@/components/shop/home/NewArrivalsRail";
import { getHomeData } from "@/lib/queries/home";
import type { Metadata } from "next";

export default async function Home() {
  const { heroProducts, newArrivals, categories, atelierEdit } =
    await getHomeData();

  return (
    <>
      <HomeHero products={heroProducts} />
      <HomeMarquee />
      {newArrivals.length > 0 && <NewArrivalsRail newArrivals={newArrivals} />}
      {categories.length > 0 && (
        <>
          <div className="stitch-divider mx-4 md:mx-8" />
          <HomeCollections categories={categories} />
        </>
      )}
      {atelierEdit.length > 0 && (
        <>
          <div className="stitch-divider mx-4 md:mx-8" />
          <AtelierEdit products={atelierEdit} />
        </>
      )}
      <div className="stitch-divider mx-4 md:mx-8" />
      {heroProducts[0] && <HomeSignature product={heroProducts[0]} />}
      <HomePromise />
    </>
  );
}

export const metadata: Metadata = {
  title: {
    absolute: "Home | shreeforstree",
  },
  description:
    "Handcrafted, made-to-order women's clothing tailored to your style. Explore our exclusive collections where every stitch is personal.",
};
