import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Applied to both th and td — e.g. "hidden md:table-cell" to drop a column on phones. */
  className?: string;
  align?: "left" | "right" | "center";
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * Typed table used by every list view: column definitions in, rows out, with a skeleton while loading
 * and an empty state when there's nothing to show. `isFetching` dims stale rows during refetches.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  isFetching,
  empty,
  skeletonRows = 6,
  caption,
  rowClassName,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  isLoading?: boolean;
  isFetching?: boolean;
  empty: React.ReactNode;
  skeletonRows?: number;
  caption?: string;
  rowClassName?: (row: T) => string | undefined;
}) {
  if (!isLoading && rows && rows.length === 0) return <>{empty}</>;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition-opacity",
        isFetching && !isLoading && "opacity-60",
      )}
      aria-busy={isLoading || isFetching}
    >
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn("h-10 px-4 text-xs font-medium tracking-wide uppercase", alignClass[col.align ?? "left"], col.className)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading || !rows
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cn("px-4 py-3", col.className)}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow key={getRowId(row)} className={rowClassName?.(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cn("px-4 py-3", alignClass[col.align ?? "left"], col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Standalone table skeleton for loading.tsx files. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-4 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
