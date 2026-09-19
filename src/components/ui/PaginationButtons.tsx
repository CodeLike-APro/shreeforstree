import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationButtons({
  totalPages,
  currentPage,
  onPageChange,
}: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex h-20 flex-col items-center justify-center">
      <div className="flex h-full w-full items-center justify-center gap-2">
        <button
          disabled={currentPage <= 1}
          className={[
            "bg-paper text-ink-55 btn-focus border-ink/10 rounded-md border p-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        {currentPage > 1 && (
          <button
            className="bg-paper text-ink-55 btn-focus border-ink/10 h-10 w-10 rounded-md border"
            onClick={() => onPageChange(currentPage - 1)}
          >
            {currentPage - 1}
          </button>
        )}
        <button
          aria-current="page"
          disabled
          className="bg-ink text-paper btn-focus border-ink/10 h-10 w-10 rounded-md border text-sm disabled:cursor-not-allowed"
        >
          {currentPage}
        </button>
        {currentPage < totalPages && (
          <button
            className="bg-paper text-ink-55 btn-focus border-ink/10 h-10 w-10 rounded-md border p-2"
            onClick={() => onPageChange(currentPage + 1)}
          >
            {currentPage + 1}
          </button>
        )}
        <button
          disabled={currentPage >= totalPages}
          className={[
            "bg-paper text-ink-55 btn-focus border-ink/10 rounded-md border p-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
          onClick={
            currentPage < totalPages
              ? () => onPageChange(currentPage + 1)
              : undefined
          }
        >
          <ChevronRight size={17} />
        </button>
      </div>
      <div>
        <p className="text-ink-55 text-sm">
          Page {currentPage} of {totalPages}
        </p>
      </div>
    </div>
  );
}
