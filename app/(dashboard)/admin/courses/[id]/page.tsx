import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { ArrowLeftIcon, LayersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { CourseActions } from "@/components/admin/course-actions";
import { PrerequisiteManager } from "@/components/admin/prerequisite-manager";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SeatMeter } from "@/components/shared/seat-meter";
import { isApiError } from "@/lib/api/errors";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";
import { plural } from "@/lib/format";

const loadCourse = (id: string) =>
  serverApi.course(id).catch((error: unknown) => {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  });

export async function generateMetadata({ params }: PageProps<"/admin/courses/[id]">): Promise<Metadata> {
  const course = await loadCourse((await params).id);
  return { title: `${course.code} · ${course.title}` };
}

export default async function AdminCourseDetailPage({ params }: PageProps<"/admin/courses/[id]">) {
  const { id } = await params;
  const [course, sections, departments] = await Promise.all([
    loadCourse(id),
    serverApi.sections({ courseId: id }),
    serverApi.departments(),
  ]);
  const department = departments.find((d) => d.id === course.departmentId);
  const state = await prefetch((qc) => qc.prefetchQuery(queries.courses(serverApi, ALL_COURSES)));
  const sorted = [...sections].sort(
    (a, b) => b.semester.startDate.localeCompare(a.semester.startDate) || a.sectionCode.localeCompare(b.sectionCode),
  );

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/admin/courses">
          <ArrowLeftIcon /> All courses
        </Link>
      </Button>
      <PageHeader
        eyebrow={department ? `${department.name} · ${plural(course.credits, "credit")}` : plural(course.credits, "credit")}
        title={`${course.code} · ${course.title}`}
        description={course.description ?? "No description yet — add one so students know what to expect."}
        actions={<CourseActions course={course} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prerequisites</CardTitle>
            <CardDescription>Students must pass these (D or better) before registering.</CardDescription>
          </CardHeader>
          <CardContent>
            <HydrationBoundary state={state}>
              <PrerequisiteManager course={course} />
            </HydrationBoundary>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Sections</CardTitle>
              <CardDescription>Every offering of this course.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/sections?courseId=${course.id}`}>Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <EmptyState icon={LayersIcon} title="Not offered yet" description="Create a section to open it for registration." className="py-8" />
            ) : (
              <ul className="space-y-3">
                {sorted.map((s) => (
                  <li key={s.id} className="rounded-2xl border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="font-medium">Section {s.sectionCode}</span>{" "}
                        <span className="text-muted-foreground">· {s.instructor.name}</span>
                      </span>
                      <Badge variant="secondary">{s.semester.name}</Badge>
                    </div>
                    <SeatMeter taken={s.enrolledCount} capacity={s.capacity} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
