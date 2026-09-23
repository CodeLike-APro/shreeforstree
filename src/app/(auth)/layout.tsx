export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper flex min-h-screen items-center justify-center">
      <main>{children}</main>
    </section>
  );
}
