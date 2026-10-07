import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { INSTRUCTORS, SectionsView } from "@/components/admin/sections-view";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";
import { parseSearch, sectionsSearch } from "@/lib/search-params";

export const metadata: Metadata = { title: "Sections" };

export default async function AdminSectionsPage({ searchParams }: PageProps<"/admin/sections">) {
  const { semesterId, courseId, instructorId } = parseSearch(sectionsSearch, await searchParams);
  const state = await prefetch((qc) =>
    Promise.all([
      qc.prefetchQuery(queries.sections(serverApi, { semesterId, courseId, instructorId })),
      qc.prefetchQuery(queries.semesters(serverApi)),
      qc.prefetchQuery(queries.courses(serverApi, ALL_COURSES)),
      qc.prefetchQuery(queries.users(serverApi, INSTRUCTORS)),
    ]),
  );

  return (
    <>
      <PageHeader
        title="Sections"
        description="Every offering of every course: who teaches it, when, and how full it is. Filters stay in the URL."
      />
      <HydrationBoundary state={state}>
        <SectionsView />
      </HydrationBoundary>
    </>
  );
}
