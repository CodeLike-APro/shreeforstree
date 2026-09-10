import dynamic from "next/dynamic";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import {
  Handbag,
  Heart,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Search,
} from "lucide-react";
import { adminCheck } from "@/lib/auth-utils";

const HeaderDesktop = dynamic(() => import("@/components/shop/HeaderDesktop"));
const HeaderMobile = dynamic(() => import("@/components/shop/HeaderMobile"));
const NavMobile = dynamic(() => import("@/utils/NavMobile"));

const TABS: Array<{ icon: ReactNode; label: string; href: string }> = [
  { icon: <Home />, label: "Home", href: "/" },
  { icon: <LayoutGrid />, label: "Shop", href: "/shop" },
  { icon: <Search />, label: "Search", href: "/search" },
  { icon: <Heart />, label: "Wishlist", href: "/wishlist" },
  { icon: <Handbag />, label: "Cart", href: "/cart" },
];

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const deviceType = headerList.get("x-device-type");
  const isAdmin = await adminCheck(headerList);

  const adminPath = isAdmin
    ? {
        label: "Admin Dashboard",
        href: "/admin/dashboard",
        icon: <LayoutDashboard />,
      }
    : undefined;

  return (
    <section className="flex min-h-screen flex-1 flex-col">
      <header className="bg-paper/80 sticky top-0 z-50 backdrop-blur-md">
        {deviceType === "mobile" ? (
          <HeaderMobile adminPath={adminPath} />
        ) : (
          <HeaderDesktop adminPath={adminPath} />
        )}
      </header>
      <main>{children}</main>
      {deviceType === "mobile" && <NavMobile tabs={TABS} />}
    </section>
  );
}
