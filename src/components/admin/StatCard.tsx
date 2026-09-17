import SparkLine from "./SparkLine";

import type { ReactNode } from "react";

export interface StatCardProps {
  icon: ReactNode;
  title: string;
  change: string;
  amount: string;
  bottomText: string;
  sparklineData: number[];
}

export default function StatCard({
  icon,
  title,
  change,
  amount,
  bottomText,
  sparklineData,
}: StatCardProps) {
  return (
    <div className="border-ink-25 flex h-auto w-auto flex-col gap-2 rounded-lg border p-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center justify-center gap-2">
          <div
            aria-label={`${title} icon`}
            className="bg-blush/40 text-rose-gold-dark flex items-center justify-center rounded-md p-2"
          >
            {icon}
          </div>
          <p
            aria-label={title}
            className="font-body text-ink-40 text-sm font-bold tracking-wider uppercase"
          >
            {title}
          </p>
        </div>
        <div
          aria-label={`${title} change`}
          className="font-body bg-sage/20 text-sage rounded-2xl px-1.5 py-0.5 text-xs font-bold"
        >
          {change}
        </div>
      </div>
      <div className="flex min-w-67 items-center justify-start">
        <div
          aria-label={`${title} amount`}
          className="font-display text-ink text-3xl font-bold"
        >
          {amount}
        </div>
      </div>
      <div className="flex w-full items-center justify-between">
        <div
          aria-label={`${title} description`}
          className="font-body text-ink-40 flex h-full items-end justify-start text-xs"
        >
          {bottomText}
        </div>
        <div className="w-20">
          <SparkLine data={sparklineData} />
        </div>
      </div>
    </div>
  );
}
