"use client";
import { useState } from "react";

type ProductDetailsProps = {
  fabric: string;
  work?: string[] | null;
  silhouette?: string | null;
  lining?: string | null;
  sleeveType?: string | null;
  neckline?: string | null;
  length?: string | null;
  careInstructions?: string | null;
};

export default function ProductDetails({
  details,
}: {
  details: ProductDetailsProps;
}) {
  const {
    fabric,
    work,
    silhouette,
    lining,
    sleeveType,
    neckline,
    length,
    careInstructions,
  } = details;

  const [showDetails, setShowDetails] = useState(true);

  return (
    <div className="mt-17 flex flex-col items-center justify-center pb-20">
      <div className="ml-12 flex items-center justify-center gap-4">
        <button
          onClick={() => setShowDetails(true)}
          className={[
            "font-label rounded-pill btn-focus border px-7 py-1.5 text-sm font-semibold tracking-wide uppercase transition-colors duration-300",
            showDetails
              ? "bg-ink text-paper border-ink"
              : "bg-paper text-ink border-ink-40",
          ].join(" ")}
        >
          Details
        </button>
        {careInstructions && (
          <button
            onClick={() => setShowDetails(false)}
            className={[
              "font-label rounded-pill btn-focus border px-7 py-1.5 text-sm font-semibold tracking-wide uppercase transition-colors duration-300",
              showDetails
                ? "bg-paper text-ink border-ink-40"
                : "bg-ink text-paper border-ink",
            ].join(" ")}
          >
            Fabric & Care
          </button>
        )}
      </div>

      {!showDetails && careInstructions && (
        <div className="mt-20 flex w-[70%] flex-col items-center justify-center gap-7">
          <h6 className="text-ink-55 text-lg font-semibold tracking-widest uppercase">
            Care Instructions
          </h6>
          <p className="font-label text-xs font-semibold tracking-widest uppercase">
            {careInstructions}
          </p>
        </div>
      )}

      {showDetails && (
        <div className="mt-20 grid w-[70%] grid-cols-1 justify-center gap-7 gap-x-10 md:grid-cols-2">
          {fabric && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Fabric
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {fabric}
              </p>
            </div>
          )}
          {work && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Work
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {work.join(", ")}
              </p>
            </div>
          )}
          {silhouette && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Silhouette
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {silhouette}
              </p>
            </div>
          )}
          {lining && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Lining
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {lining}
              </p>
            </div>
          )}
          {sleeveType && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Sleeve Type
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {sleeveType}
              </p>
            </div>
          )}
          {neckline && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Neckline
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {neckline}
              </p>
            </div>
          )}
          {length && (
            <div className="border-ink-40 flex justify-between border-b pb-4">
              <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
                Length
              </h6>
              <p className="font-label text-xs font-semibold tracking-widest uppercase">
                {length}
              </p>
            </div>
          )}
          <div className="border-ink-40 flex justify-between border-b pb-4">
            <h6 className="text-ink-55 text-xs font-semibold tracking-widest uppercase">
              Made in
            </h6>
            <p className="font-label text-xs font-semibold tracking-widest uppercase">
              Our atelier, by hand
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
