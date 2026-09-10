"use client";
import { useState } from "react";

export default function ProductDescription({
  description,
}: {
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const descriptionLength = description.length;

  const descriptionCap = 250;

  if (descriptionLength < descriptionCap && !expanded) {
    setExpanded(true);
  }

  return (
    <div className="relative">
      <p
        className={[
          "font-serif-alt text-ink mt-5 whitespace-pre-line italic md:text-xl",
          expanded ? "" : "line-clamp-3",
        ].join(" ")}
      >
        {description}
      </p>

      {!expanded && descriptionLength > descriptionCap && (
        <div className="bg-paper absolute right-24 bottom-0">...</div>
      )}

      {descriptionLength > descriptionCap && (
        <button
          className={[
            "font-serif-alt text-rose-gold btn-focus hover:text-rose-gold-dark rounded-md px-2 text-xl font-semibold italic hover:underline",
            expanded ? "" : "bg-paper absolute right-0 bottom-0",
          ].join(" ")}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
