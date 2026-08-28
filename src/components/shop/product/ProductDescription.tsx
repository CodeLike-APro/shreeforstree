"use client";
import { useState } from "react";

export default function ProductDescription({
  description,
}: {
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const descriptionLength = description.length;

  if (descriptionLength < 220) {
    setExpanded(true);
  }

  return (
    <div className="relative">
      <p
        className={[
          "font-serif-alt text-ink mt-5 whitespace-pre-line md:text-xl",
          expanded ? "" : "line-clamp-3",
        ].join(" ")}
      >
        {description}
      </p>

      {!expanded && descriptionLength > 220 && (
        <div className="bg-paper absolute right-23 bottom-0">...</div>
      )}

      {descriptionLength > 220 && (
        <button
          className={[
            "font-serif-alt text-rose-gold hover:text-rose-gold-dark text-xl font-semibold italic hover:underline",
            expanded ? "" : "bg-paper absolute right-0 bottom-0 pl-1",
          ].join(" ")}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
