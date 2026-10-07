"use client";

import { useQuery } from "@tanstack/react-query";
import { BracesIcon, HistoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LocalTime } from "@/components/shared/local-time";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { queries } from "@/lib/api/queries";
import type { AuditLog } from "@/lib/api/types";
import { humanize } from "@/lib/format";
import { auditLogSearch, parseSearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const AUDIT_PAGE_SIZE = 15;

/** Actions the API records, grouped by the entity they touch. */
const ACTIONS: Record<string, string[]> = {
  Enrollment: ["ENROLLMENT_CREATED", "ENROLLMENT_DROPPED", "GRADE_SUBMITTED"],
  User: ["ROLE_CHANGED", "USER_STATUS_CHANGED"],
  Payment: ["PAYMENT_SUCCEEDED"],
};

const actionTone = (action: string) =>
  action.includes("DROPPED") || action.includes("STATUS")
    ? "bg-warning/20 text-highlight-foreground dark:text-warning"
    : action.includes("PAYMENT")
      ? "bg-success/15 text-success"
      : action.includes("ROLE")
        ? "bg-primary/10 text-primary"
        : "bg-info/15 text-info";

const columns: Column<AuditLog>[] = [
  {
    id: "when",
    header: "When",
    cell: (l) => (
      <LocalTime value={l.createdAt} mode="relative" />
    ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: (l) =>
      l.actor ? (
        <div className="min-w-0">
          <p className="truncate font-medium">{l.actor.name}</p>
          <p className="truncate text-xs text-muted-foreground">{l.actor.email}</p>
        </div>
      ) : (
        <span className="text-muted-foreground">System (Stripe)</span>
      ),
  },
  {
    id: "action",
    header: "Action",
    cell: (l) => (
      <Badge variant="secondary" className={cn(actionTone(l.action))}>
        {humanize(l.action)}
      </Badge>
    ),
  },
  {
    id: "entity",
    header: "Record",
    cell: (l) => (
      <span className="font-mono text-xs">
        {l.entity}/<span className="text-muted-foreground">{l.entityId.slice(0, 10)}…</span>
      </span>
    ),
    className: "hidden md:table-cell",
  },
  {
    id: "meta",
    header: <span className="sr-only">Details</span>,
    align: "right",
    cell: (l) =>
      l.metadata && typeof l.metadata === "object" ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Show details">
              <BracesIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              <LocalTime value={l.createdAt} />
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(l.metadata, null, 2)}</pre>
          </PopoverContent>
        </Popover>
      ) : null,
  },
];

export function AuditLogView() {
  const { searchParams, setParams } = useQueryParams();
  const filters = parseSearch(auditLogSearch, searchParams);
  const { data, isPending, isFetching } = useQuery(queries.auditLogs(api, { ...filters, limit: AUDIT_PAGE_SIZE }));
  const actions = filters.entity ? (ACTIONS[filters.entity] ?? []) : Object.values(ACTIONS).flat();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={filters.entity ?? "all"}
          onValueChange={(v) => setParams({ entity: v === "all" ? null : v, action: null })}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by record type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            {Object.keys(ACTIONS).map((e) => (
              <SelectItem key={e} value={e}>
                {e}s
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.action ?? "all"} onValueChange={(v) => setParams({ action: v === "all" ? null : v })}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by action">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {humanize(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        caption="Audit log"
        columns={columns}
        rows={data?.items}
        getRowId={(l) => l.id}
        isLoading={isPending}
        isFetching={isFetching}
        skeletonRows={8}
        empty={
          <EmptyState
            icon={HistoryIcon}
            title="No matching events"
            description="Enrollments, drops, grades, role and status changes, and payments are recorded here as they happen."
          />
        }
      />
      {data && (
        <PaginationBar page={data.meta.page} pageSize={data.meta.limit} total={data.meta.total} onPageChange={(page) => setParams({ page })} />
      )}
    </div>
  );
}
