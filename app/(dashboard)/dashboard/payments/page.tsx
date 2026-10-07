import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentsView } from "@/components/student/payments-view";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "Tuition & payments" };

export default async function PaymentsPage() {
  const state = await prefetch((qc) =>
    Promise.all([qc.prefetchQuery(queries.myInvoices(serverApi)), qc.prefetchQuery(queries.myEnrollments(serverApi))]),
  );

  return (
    <>
      <PageHeader
        title="Tuition & payments"
        description="Invoices are calculated from your enrolled credits at each semester's per-credit rate. Pay securely through Stripe."
      />
      <HydrationBoundary state={state}>
        <PaymentsView />
      </HydrationBoundary>
    </>
  );
}
