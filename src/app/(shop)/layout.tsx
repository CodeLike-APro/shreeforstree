import dynamic from "next/dynamic";
import { headers } from "next/headers";
import { Handbag, Heart, Home, LayoutGrid, Search } from "lucide-react";

const HeaderDesktop = dynamic(() => import("@/components/shop/HeaderDesktop"));
const HeaderMobile = dynamic(() => import("@/components/shop/HeaderMobile"));
const NavMobile = dynamic(() => import("@/utils/NavMobile"));

const TABS = [
  { icon: <Home />, label: "Home", href: "/" },
  { icon: <LayoutGrid />, label: "Shop", href: "/shop" },
  { icon: <Search />, label: "Search", href: "/search" },
  { icon: <Heart />, label: "Wishlist", href: "/wishlist" },
  { icon: <Handbag />, label: "Cart", href: "/cart" },
] as const;

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const deviceType = headerList.get("x-device-type");

  return (
    <section className="flex min-h-screen flex-1 flex-col">
      <header>
        {deviceType === "mobile" ? <HeaderMobile /> : <HeaderDesktop />}
      </header>
      <main>{children}</main>
      {deviceType === "mobile" && <NavMobile tabs={TABS} />}
    </section>
  );
}
