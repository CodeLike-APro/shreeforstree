import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center text-center">
      <h1 className="font-display md:text-ink text-4xl font-bold md:text-8xl">
        SHREEFORSTREE
      </h1>
      <Link
        href="/admin/dashboard"
        className="font-serif-alt bg-ink text-paper hover:bg-paper border-ink hover:text-ink mt-4 rounded-md border px-3 py-2 text-xl font-bold tracking-widest transition-all duration-300"
      >
        Admin
      </Link>
    </div>
  );
}
