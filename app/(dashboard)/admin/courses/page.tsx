import type { Metadata } from "next";
import Link from "next/link";
import { HydrationBoundary } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_COURSES_PAGE_SIZE, CoursesView } from "@/components/admin/courses-view";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";
import { courseCatalogSearch, parseSearch } from "@/lib/search-params";

export const metadata: Metadata = { title: "Courses" };

export default async function AdminCoursesPage({ searchParams }: PageProps<"/admin/courses">) {
  const filters = parseSearch(courseCatalogSearch, await searchParams);
  const state = await prefetch((qc) =>
    Promise.all([
      qc.prefetchQuery(queries.courses(serverApi, { ...filters, limit: ADMIN_COURSES_PAGE_SIZE })),
      qc.prefetchQuery(queries.departments(serverApi)),
    ]),
  );

  return (
    <>
      <PageHeader
        title="Courses"
        description="The course catalogue students register from. Open a course to manage its prerequisite chain."
        actions={
          <Button asChild>
            <Link href="/admin/courses/new">
              <PlusIcon /> New course
            </Link>
          </Button>
        }
      />
      <HydrationBoundary state={state}>
        <CoursesView />
      </HydrationBoundary>
    </>
  );
}
