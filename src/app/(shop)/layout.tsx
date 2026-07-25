import dynamic from "next/dynamic";
import { headers } from "next/headers";
import {
  HandbagIcon,
  HeartIcon,
  HomeIcon,
  LayoutGrid,
  SearchIcon,
} from "lucide-react";

const HeaderDesktop = dynamic(() => import("@/components/shop/HeaderDesktop"));
const HeaderMobile = dynamic(() => import("@/components/shop/HeaderMobile"));
const NavMobile = dynamic(() => import("@/utils/NavMobile"));

const TABS = [
  { icon: <HomeIcon />, label: "Home", href: "/" },
  { icon: <LayoutGrid />, label: "Shop", href: "/shop" },
  { icon: <SearchIcon />, label: "Search", href: "/search" },
  { icon: <HeartIcon />, label: "Wishlist", href: "/wishlist" },
  { icon: <HandbagIcon />, label: "Cart", href: "/cart" },
] as const;

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const deviceType = headerList.get("x-device-type");

  return (
    <section className="min-h-screen flex flex-1 flex-col">
      <header>
        {deviceType === "mobile" ? <HeaderMobile /> : <HeaderDesktop />}
      </header>
      <main>{children}</main>
      {deviceType === "mobile" && <NavMobile tabs={TABS} />}
    </section>
  );
}
