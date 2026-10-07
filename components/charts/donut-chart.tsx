"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Share-of-total chart with the total in the middle (e.g. users by role). */
export function DonutChart({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const config = Object.fromEntries(slices.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig;
  const data = slices.map((s) => ({ key: s.key, value: s.value, fill: `var(--color-${s.key})` }));
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-64 max-h-64">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius={62} outerRadius={92} strokeWidth={4} paddingAngle={2}>
          <Label
            content={({ viewBox }) =>
              viewBox && "cx" in viewBox && "cy" in viewBox ? (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-heading text-3xl font-semibold">
                    {total}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                    {centerLabel}
                  </tspan>
                </text>
              ) : null
            }
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}
