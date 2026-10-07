import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { DepartmentsView } from "@/components/admin/departments-view";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "Departments" };

export default async function AdminDepartmentsPage() {
  const state = await prefetch((qc) => Promise.all([qc.prefetchQuery(queries.departments(serverApi)), qc.prefetchQuery(queries.courses(serverApi, ALL_COURSES))]));
  return (
    <>
      <PageHeader title="Departments" description="Departments own the catalogue's courses and group students and instructors." />
      <HydrationBoundary state={state}>
        <DepartmentsView />
      </HydrationBoundary>
    </>
  );
}
