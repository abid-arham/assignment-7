"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { useQueryParams } from "@/hooks/use-query-params";
import type { Department } from "@/lib/api/types";
import { courseCatalogSearch, parseSearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

/**
 * Filters for the public catalogue. The results are a Server Component (children): changing a filter
 * calls router.replace inside a transition, so the server re-renders with the new searchParams while
 * the current results stay visible, dimmed.
 */
export function CatalogShell({
  departments,
  total,
  pageSize,
  children,
}: {
  departments: Department[];
  total: number;
  pageSize: number;
  children: React.ReactNode;
}) {
  const { searchParams, setParams, isPending } = useQueryParams({ mode: "server" });
  const filters = parseSearch(courseCatalogSearch, searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={filters.q ?? ""}
          onSearch={(q) => setParams({ q })}
          placeholder="Search by code or title"
          label="Search courses"
          className="sm:max-w-sm"
        />
        <Select value={filters.departmentId ?? "all"} onValueChange={(v) => setParams({ departmentId: v === "all" ? null : v })}>
          <SelectTrigger className="w-full sm:w-60" aria-label="Department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.sortBy} onValueChange={(v) => setParams({ sortBy: v === "title" ? null : v })}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title A–Z</SelectItem>
            <SelectItem value="code">Course code</SelectItem>
            <SelectItem value="createdAt">Longest running</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">
          {isPending ? "Updating…" : `${total} ${total === 1 ? "course" : "courses"}`}
        </p>
      </div>

      <div className={cn("transition-opacity", isPending && "pointer-events-none opacity-50")} aria-busy={isPending}>
        {children}
      </div>

      <PaginationBar page={filters.page} pageSize={pageSize} total={total} onPageChange={(page) => setParams({ page })} />
    </div>
  );
}
