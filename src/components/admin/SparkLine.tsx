"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

type SparkLineProps = {
  data: number[];
  color?: string;
  height?: number;
};

export default function SparkLine({
  data,
  color = "var(--color-sage)",
  height = 40,
}: SparkLineProps) {
  if (data.length < 2) return null;

  const chartData = data.map((v) => ({ v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 2, bottom: 4, left: 2 }}
      >
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
