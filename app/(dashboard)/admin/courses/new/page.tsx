import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { CourseWizard } from "@/components/admin/course-wizard/course-wizard";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  const state = await prefetch((qc) =>
    Promise.all([qc.prefetchQuery(queries.departments(serverApi)), qc.prefetchQuery(queries.courses(serverApi, ALL_COURSES))]),
  );

  return (
    <>
      <PageHeader
        title="New course"
        description="Add a course to the catalogue in four short steps. Your draft is kept if you leave this page."
      />
      <HydrationBoundary state={state}>
        <CourseWizard />
      </HydrationBoundary>
    </>
  );
}
