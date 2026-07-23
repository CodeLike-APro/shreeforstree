import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const deviceType = headerList.get("x-device-type");
  const session = headerList.get("x-session");
  if (session) redirect("/");
  return (
    <section className="min-h-screen flex items-center justify-center bg-paper">
      {session ? <div>You're already logged in</div> : <main>{children}</main>}
    </section>
  );
}
