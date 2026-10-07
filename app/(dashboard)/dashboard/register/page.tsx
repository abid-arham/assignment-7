import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { RegistrationView } from "@/components/student/registration/registration-view";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";
import { parseSearch, registrationSearch } from "@/lib/search-params";
import { pickRegistrationSemester } from "@/lib/semesters";

export const metadata: Metadata = { title: "Course registration" };

export default async function RegisterPage({ searchParams }: PageProps<"/dashboard/register">) {
  const filters = parseSearch(registrationSearch, await searchParams);

  const state = await prefetch(async (qc) => {
    const [semesters] = await Promise.all([
      qc.fetchQuery(queries.semesters(serverApi)).catch(() => []),
      qc.prefetchQuery(queries.departments(serverApi)),
      qc.prefetchQuery(queries.myEnrollments(serverApi)),
    ]);
    // Same choice the client makes, so the sections list hydrates under the same key.
    const semester = pickRegistrationSemester(semesters, filters.semesterId);
    if (semester) await qc.prefetchQuery(queries.sections(serverApi, { semesterId: semester.id }));
  });

  return (
    <>
      <PageHeader
        title="Course registration"
        description="Shortlist sections into your plan, check credits and estimated tuition, then register for all of them in one go. Prerequisites and seat limits are checked when you register."
      />
      <HydrationBoundary state={state}>
        <RegistrationView />
      </HydrationBoundary>
    </>
  );
}
