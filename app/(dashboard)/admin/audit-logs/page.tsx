import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { AUDIT_PAGE_SIZE, AuditLogView } from "@/components/admin/audit-log-view";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";
import { auditLogSearch, parseSearch } from "@/lib/search-params";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit-logs">) {
  const filters = parseSearch(auditLogSearch, await searchParams);
  const state = await prefetch((qc) => qc.prefetchQuery(queries.auditLogs(serverApi, { ...filters, limit: AUDIT_PAGE_SIZE })));

  return (
    <>
      <PageHeader
        title="Audit log"
        description="An append-only record of sensitive changes, written in the same database transaction as the change itself."
      />
      <HydrationBoundary state={state}>
        <AuditLogView />
      </HydrationBoundary>
    </>
  );
}
