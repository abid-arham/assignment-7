import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { EnrollmentsView } from "@/components/student/enrollments-view";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "My enrollments" };

export default async function EnrollmentsPage() {
  // Prefetched on the server, then owned by TanStack Query in the browser (tabs and drops are instant).
  const state = await prefetch((qc) => qc.prefetchQuery(queries.myEnrollments(serverApi)));

  return (
    <>
      <PageHeader
        title="My enrollments"
        description="Every section you've registered for, with grades once they're posted. Drop a course while it's still active."
      />
      <HydrationBoundary state={state}>
        <EnrollmentsView />
      </HydrationBoundary>
    </>
  );
}
