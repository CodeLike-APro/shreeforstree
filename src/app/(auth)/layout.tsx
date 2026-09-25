import MotionProvider from "@/components/ui/MotionProvider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper flex min-h-screen items-center justify-center">
      <MotionProvider>
        <main>{children}</main>
      </MotionProvider>
    </section>
  );
}
