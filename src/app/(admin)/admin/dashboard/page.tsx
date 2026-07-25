import Link from "next/link";

export default function admin() {
  return (
    <div className=" h-screen w-full text-center flex flex-col items-center  justify-center">
      <h1 className="text-4xl md:text-8xl font-display md:text-ink font-bold">
        ADMIN
      </h1>
      <Link
        href="/"
        className="mt-4 text-xl font-serif-alt font-bold py-2 px-3 bg-ink text-paper rounded-md tracking-widest hover:bg-paper border border-ink hover:text-ink transition-all duration-300"
      >
        HOME
      </Link>
    </div>
  );
}
