import { MoveRight } from "lucide-react";
import Link from "next/link";

export function ArrowLink({
  title,
  href,
  textColor = "text-ink",
}: {
  title: string;
  href: string;
  textColor?: string;
}) {
  return (
    <Link
      href={href}
      className={`label-caps group btn-focus ${textColor} relative flex shrink-0 gap-2 rounded-sm px-1 py-1 text-[0.6rem] transition-opacity hover:opacity-70 md:text-[0.65rem]`}
    >
      {title}
      <span>
        <MoveRight size={14} />
      </span>
      <div className="bg-rose-gold absolute bottom-0 left-0 h-0.5 w-full group-focus-visible:hidden" />
    </Link>
  );
}
