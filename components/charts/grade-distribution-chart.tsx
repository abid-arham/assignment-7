"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { GRADES } from "@/lib/api/types";

const config = { count: { label: "Students", color: "var(--chart-1)" } } satisfies ChartConfig;

const bandColor = (grade: string) =>
  grade.startsWith("A")
    ? "var(--success)"
    : grade.startsWith("B")
      ? "var(--info)"
      : grade.startsWith("C")
        ? "var(--warning)"
        : "var(--destructive)";

/** Count of each letter grade, A+ → F, coloured by band. */
export function GradeDistributionChart({
  grades,
  label = "Students",
  className,
}: {
  grades: (string | null)[];
  label?: string;
  className?: string;
}) {
  const data = GRADES.map((grade) => ({ grade, count: grades.filter((g) => g === grade).length }));

  return (
    <ChartContainer config={{ count: { ...config.count, label } }} className={className ?? "aspect-auto h-56 w-full"}>
      <BarChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="grade" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.grade} fill={bandColor(d.grade)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
