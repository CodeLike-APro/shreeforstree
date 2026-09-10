import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const session = headerList.get("x-session");
  if (session) redirect("/");
  return (
    <section className="bg-paper flex min-h-screen items-center justify-center">
      {session ? (
        <div>You&apos;re already logged in</div>
      ) : (
        <main>{children}</main>
      )}
    </section>
  );
}
