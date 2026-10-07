"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Recharts is the heaviest client dependency, so charts are code-split and loaded only on pages that
 * draw one, with a same-size skeleton while the chunk downloads.
 */
const chartSkeleton = () => <Skeleton className="h-56 w-full rounded-xl" />;

export const LazyGradeDistributionChart = dynamic(
  () => import("./grade-distribution-chart").then((m) => m.GradeDistributionChart),
  { ssr: false, loading: chartSkeleton },
);

export const LazyBarListChart = dynamic(() => import("./bar-list-chart").then((m) => m.BarListChart), {
  ssr: false,
  loading: chartSkeleton,
});
