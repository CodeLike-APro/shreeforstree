import dynamic from "next/dynamic";
import { headers } from "next/headers";

const HeaderDesktop = dynamic(() => import("@/components/shop/HeaderDesktop"));
const HeaderMobile = dynamic(() => import("@/components/shop/HeaderMobile"));
const NavMobile = dynamic(() => import("@/components/shop/NavMobile"));

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
      {deviceType === "mobile" && <NavMobile />}
    </section>
  );
}
