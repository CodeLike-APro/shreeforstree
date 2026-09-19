"use client";

import { Ban, Check, MoveRight, Undo2 } from "lucide-react";
import { VALID_ORDER_TRANSITIONS } from "@/lib/constants";

import type { OrderStatus } from "@/types/models";

const STEPS = ["placed", "confirmed", "shipped", "delivered"] as const;

const ACTIVE_INDEX: Record<OrderStatus, number> = {
  placed: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  not_placed: -1,
  cancelled: -1,
  returned: 3,
};

const dotClasses: Record<"done" | "next" | "upcoming", string> = {
  done: "bg-ink",
  next: "bg-paper border-2 border-rose-gold/80 ring-rose-gold/20 ring-4 animate-pulse motion-reduce:animate-none",
  upcoming: "bg-ink-15 border-ink-25 border border-dashed",
};

const textClasses: Record<"done" | "next" | "upcoming", string> = {
  done: "text-ink font-semibold",
  next: "text-rose-gold font-bold",
  upcoming: "text-ink-55",
};

export default function OrderTracker({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const activeIndex = ACTIVE_INDEX[status];
  const progress =
    activeIndex <= 0 ? 0 : (activeIndex / (STEPS.length - 1)) * 100;
  const segment = 100 / (STEPS.length - 1);
  const hasNext = status !== "cancelled" && activeIndex < STEPS.length - 1;

  const transitions =
    status === "not_placed" ? [] : VALID_ORDER_TRANSITIONS[status];

  const isTerminal = status === "cancelled" || status === "returned";

  return (
    <div className="border-ink/10 w-full rounded-xl border p-4">
      <div className="flex w-full flex-col items-start justify-between gap-4">
        <h5 className="label-caps text-ink-55 w-full text-xs">status</h5>
        <div
          className={[
            "relative w-full",
            !isTerminal ? "border-ink/10 border-b pb-4" : "",
          ].join(" ")}
        >
          <div className="bg-ink-15 absolute top-4 right-4 left-4 h-0.75">
            <div
              className="bg-ink absolute inset-y-0 h-full"
              style={{ width: `${progress}%` }}
            />
            {hasNext && activeIndex >= 0 && (
              <div
                className="bg-rose-gold absolute inset-y-0 animate-pulse motion-reduce:animate-none"
                style={{ left: `${progress}%`, width: `${segment}%` }}
              />
            )}
          </div>
          <ol className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const state =
                index <= activeIndex
                  ? "done"
                  : hasNext && index === activeIndex + 1
                    ? "next"
                    : "upcoming";

              return (
                <li
                  aria-current={state === "next" ? "step" : undefined}
                  key={step}
                  className={[
                    "flex flex-col gap-3",
                    index === 0
                      ? "items-start"
                      : index === STEPS.length - 1
                        ? "items-end"
                        : "items-center",
                  ].join(" ")}
                >
                  <div className="bg-paper flex items-center justify-center">
                    <div
                      className={`text-paper flex h-8 w-8 items-center justify-center rounded-full ${dotClasses[state]}`}
                    >
                      {state === "done" && <Check size={15} />}
                      {state === "next" && (
                        <div className="bg-paper h-2.25 w-2.25 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <span className={`label-caps text-xs ${textClasses[state]}`}>
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
          {isTerminal && (
            <div className="font-label border-rust/50 bg-rust/5 mt-4 flex items-start justify-start gap-2 rounded-xl border p-3">
              <div className="text-rust mt-1">
                {status === "cancelled" ? (
                  <Ban size={17} />
                ) : (
                  <Undo2 size={17} />
                )}
              </div>
              <div>
                <h6 className="text-rust font-bold">
                  {status === "cancelled" ? "Cancelled" : "Returned"}
                </h6>
                <p className="text-ink-55 tracking-wide">
                  {status === "cancelled"
                    ? "This order was stopped and will not be fulfilled."
                    : "This order came back after it was delivered."}
                </p>
              </div>
            </div>
          )}
        </div>

        {!isTerminal && (
          <div>
            {status === "not_placed" ? (
              <p>Awaiting payment, nothing to be done yet.</p>
            ) : (
              <>
                <p>Move this order on:</p>
                <div className="mt-2 flex flex-wrap items-center justify-start gap-2">
                  {transitions.map((next) => {
                    const isDestructive =
                      next === "cancelled" || next === "returned";

                    return (
                      <button
                        key={next}
                        type="button"
                        className={[
                          "btn-focus label-caps flex items-center justify-center gap-2 rounded-md border p-3 text-xs font-bold transition-colors duration-150",
                          isDestructive
                            ? "bg-rust/5 text-rust border-rust hover:bg-rust hover:text-paper"
                            : "border-rose-gold hover:bg-rose-gold-dark bg-rose-gold text-paper",
                        ].join(" ")}
                      >
                        <span className="mt-0.5">{next}</span>
                        {!isDestructive && <MoveRight size={13} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
