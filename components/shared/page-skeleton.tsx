import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/shared/stat-card";
import { TableSkeleton } from "@/components/shared/data-table";

/** Skeletons for loading.tsx files, shaped like the page that is about to appear. */
export function PageSkeleton({
  variant,
  stats = 0,
  filters = 0,
}: {
  variant: "table" | "cards" | "charts" | "form";
  stats?: number;
  filters?: number;
}) {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {stats > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}
      {filters > 0 && (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: filters }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-2xl sm:w-48" />
          ))}
        </div>
      )}
      {variant === "table" && <TableSkeleton />}
      {variant === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      )}
      {variant === "charts" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      )}
      {variant === "form" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
        </div>
      )}
    </div>
  );
}
