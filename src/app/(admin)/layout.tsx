import dynamic from "next/dynamic";
import { headers } from "next/headers";
import {
  Box,
  LayoutDashboard,
  LayoutGrid,
  Settings2,
  Shirt,
  Users,
} from "lucide-react";
import { auth } from "@/lib/db/auth";
import { redirect } from "next/navigation";

const AdminSidebar = dynamic(() => import("@/components/admin/AdminSidebar"));
const NavMobile = dynamic(() => import("@/utils/NavMobile"));
const AdminDesktopTopBar = dynamic(
  () => import("@/components/admin/AdminDesktopTopBar"),
);
const AdminMobileTopBar = dynamic(
  () => import("@/components/admin/AdminMobileTopBar"),
);

const TABS = [
  { icon: <LayoutDashboard />, label: "Dashboard", href: "/admin/dashboard" },
  { icon: <Shirt />, label: "Products", href: "/admin/products" },
  { icon: <LayoutGrid />, label: "Categories", href: "/admin/categories" },
  { icon: <Box />, label: "Orders", href: "/admin/orders" },
  { icon: <Users />, label: "Users", href: "/admin/users" },
  { icon: <Settings2 />, label: "Settings", href: "/admin/settings" },
] as const;

export default async function AdminLayout({
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
    <section
      className={`flex min-h-screen w-full flex-1 ${
        deviceType === "mobile" ? "flex-col" : "flex-row"
      }`}
    >
      {deviceType !== "mobile" && (
        <nav className="shrink-0">
          <AdminSidebar />
        </nav>
      )}
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        {deviceType === "mobile" ? (
          <AdminMobileTopBar />
        ) : (
          <AdminDesktopTopBar />
        )}
        {children}
      </main>
      {deviceType === "mobile" && <NavMobile tabs={TABS} />}
    </section>
  );
}
