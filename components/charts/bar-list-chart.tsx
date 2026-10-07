"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface BarDatum {
  label: string;
  [series: string]: string | number;
}

/**
 * Horizontal bars, one row per item (sections, departments…). Pass one or more series; several series
 * are stacked (e.g. seats taken + seats free).
 */
export function BarListChart({
  data,
  series,
  max,
  decimals = 0,
  showValues = true,
}: {
  data: BarDatum[];
  series: { key: string; label: string; color: string }[];
  max?: number;
  /** Plain data (not a formatter function) so Server Components can render this chart. */
  decimals?: number;
  showValues?: boolean;
}) {
  const config = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig;
  const stacked = series.length > 1;

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(160, data.length * 40 + 40) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" domain={[0, max ?? "auto"]} hide />
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={116} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={`var(--color-${s.key})`}
            stackId={stacked ? "stack" : undefined}
            radius={stacked ? (i === series.length - 1 ? [0, 6, 6, 0] : 0) : 6}
          >
            {showValues && (!stacked || i === 0) && (
              <LabelList
                dataKey={s.key}
                position={stacked ? "insideLeft" : "right"}
                className={stacked ? "fill-background" : "fill-foreground"}
                fontSize={12}
                formatter={(v: unknown) => (typeof v === "number" ? v.toFixed(decimals) : "")}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
}
