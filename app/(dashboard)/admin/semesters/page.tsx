import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { SemestersView } from "@/components/admin/semesters-view";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "Semesters" };

export default async function AdminSemestersPage() {
  const state = await prefetch((qc) => Promise.all([qc.prefetchQuery(queries.semesters(serverApi))]));
  return (
    <>
      <PageHeader title="Semesters" description="Create terms, set the per-credit tuition and open or close registration." />
      <HydrationBoundary state={state}>
        <SemestersView />
      </HydrationBoundary>
    </>
  );
}
