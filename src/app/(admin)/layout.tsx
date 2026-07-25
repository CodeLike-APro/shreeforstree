import { auth } from "@/lib/db/auth";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Box,
  LayoutDashboard,
  LayoutGrid,
  Settings2,
  Shirt,
  Users,
} from "lucide-react";

const AdminSidebar = dynamic(() => import("@/components/admin/AdminSidebar"));
const AdminMobileHeader = dynamic(
  () => import("@/components/admin/AdminMobileHeader"),
);
const NavMobile = dynamic(() => import("@/utils/NavMobile"));

const TABS = [
  { icon: <LayoutDashboard />, label: "Dashboard", href: "/admin/dashboard" },
  { icon: <Shirt />, label: "Products", href: "/admin/products" },
  { icon: <LayoutGrid />, label: "Categories", href: "/admin/categories" },
  { icon: <Box />, label: "Orders", href: "/admin/orders" },
  { icon: <Users />, label: "Users", href: "/admin/users" },
  { icon: <Settings2 />, label: "Settings", href: "/admin/settings" },
] as const;

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });
  const deviceType = headerList.get("x-device-type");
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <section className="min-h-screen flex flex-1 flex-col">
      <header>{deviceType === "mobile" && <AdminMobileHeader />}</header>
      <nav>{deviceType !== "mobile" && <AdminSidebar />} </nav>
      <main>{children}</main>
      {deviceType === "mobile" && <NavMobile tabs={TABS} />}
    </section>
  );
}
