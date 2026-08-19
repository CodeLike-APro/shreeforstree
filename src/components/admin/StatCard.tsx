import { ReactNode } from "react";
import SparkLine from "./SparkLine";

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
    <div className="h-auto w-auto flex flex-col gap-2 border border-ink-25 rounded-lg p-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center justify-center gap-2">
          <div
            aria-label={`${title} icon`}
            className="flex items-center justify-center p-2 bg-blush/40 rounded-md text-rose-gold-dark"
          >
            {icon}
          </div>
          <p
            aria-label={title}
            className="font-body font-bold text-ink-40 uppercase tracking-wider text-sm "
          >
            {title}
          </p>
        </div>
        <div
          aria-label={`${title} change`}
          className="font-body font-bold text-xs bg-sage/20 text-sage rounded-2xl px-1.5 py-0.5"
        >
          {change}
        </div>
      </div>
      <div className="flex items-center justify-start min-w-67 ">
        <div
          aria-label={`${title} amount`}
          className="font-display text-ink font-bold text-3xl"
        >
          {amount}
        </div>
      </div>
      <div className="flex w-full items-center justify-between ">
        <div
          aria-label={`${title} description`}
          className="font-body text-xs text-ink-40 h-full flex items-end justify-start"
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
