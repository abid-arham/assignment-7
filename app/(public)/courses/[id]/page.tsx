import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, GitBranchIcon, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCta } from "@/components/site/course-cta";
import { EmptyState } from "@/components/shared/empty-state";
import { SeatMeter } from "@/components/shared/seat-meter";
import { StatusBadge } from "@/components/shared/status-badge";
import { isApiError } from "@/lib/api/errors";
import { publicApi } from "@/lib/api/server";
import type { SectionWithRelations } from "@/lib/api/types";
import { formatDateRange, formatMoney, plural } from "@/lib/format";
import { semesterPhase } from "@/lib/semesters";

const loadCourse = (id: string) =>
  publicApi.course(id).catch((error: unknown) => {
    if (isApiError(error) && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  });

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const course = await loadCourse((await params).id);
  const description =
    course.description ?? `${course.title} (${course.code}), ${plural(course.credits, "credit")}, at Quad.`;
  return {
    title: `${course.code} · ${course.title}`,
    description,
    openGraph: { title: `${course.code} · ${course.title}`, description, type: "article" },
  };
}

export default async function CourseDetailPage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const [course, sections, departments] = await Promise.all([
    loadCourse(id),
    publicApi.sections({ courseId: id }),
    publicApi.departments(),
  ]);
  const department = departments.find((d) => d.id === course.departmentId);

  // Group offerings by semester, upcoming/current first.
  const bySemester = Object.values(
    sections.reduce<Record<string, SectionWithRelations[]>>((acc, s) => {
      (acc[s.semesterId] ??= []).push(s);
      return acc;
    }, {}),
  ).sort((a, b) => b[0]!.semester.startDate.localeCompare(a[0]!.semester.startDate));
  const isOffered = sections.some((s) => s.semester.enrollmentOpen);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/courses">
          <ArrowLeftIcon /> Catalogue
        </Link>
      </Button>

      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{plural(course.credits, "credit")}</Badge>
          {department && (
            <Badge variant="outline" asChild>
              <Link href={`/courses?departmentId=${department.id}`}>{department.name}</Link>
            </Badge>
          )}
          {isOffered && <StatusBadge status="OPEN" />}
        </div>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          <span className="text-primary">{course.code}</span> {course.title}
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          {course.description ?? "The department hasn't published a description for this course yet."}
        </p>
        <CourseCta courseId={course.id} courseCode={course.code} isOffered={isOffered} />
      </header>

      <section aria-labelledby="prereq-heading" className="rounded-3xl border bg-card p-6">
        <h2 id="prereq-heading" className="flex items-center gap-2 text-xl font-semibold">
          <GitBranchIcon className="size-5 text-primary" /> Prerequisites
        </h2>
        {course.prerequisites.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None — open to every student.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Pass these with a D or better before registering:</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {course.prerequisites.map(({ prerequisite: p }) => (
                <li key={p.id}>
                  <Link
                    href={`/courses/${p.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="font-semibold text-primary">{p.code}</span> {p.title}
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="sections-heading" className="space-y-4">
        <h2 id="sections-heading" className="text-2xl font-semibold">
          When it&apos;s offered
        </h2>
        {bySemester.length === 0 ? (
          <EmptyState icon={CalendarIcon} title="Not scheduled yet" description="No sections of this course have been scheduled. Check back next term." />
        ) : (
          bySemester.map((group) => {
            const semester = group[0]!.semester;
            const phase = semesterPhase(semester);
            return (
              <div key={semester.id} className="rounded-3xl border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                  <div>
                    <h3 className="font-sans text-base font-semibold tracking-normal">{semester.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(semester.startDate, semester.endDate)} · {formatMoney(semester.tuitionPerCredit)} per credit
                    </p>
                  </div>
                  <StatusBadge status={semester.enrollmentOpen ? "OPEN" : "CLOSED"} />
                </div>
                <ul className="divide-y">
                  {group.map((s) => (
                    <li key={s.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_12rem] sm:items-center">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Section {s.sectionCode}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <UserIcon className="size-3.5" /> {s.instructor.name}
                        </span>
                      </p>
                      {phase === "past" ? (
                        <p className="text-xs text-muted-foreground">Completed · {s.enrolledCount} students</p>
                      ) : (
                        <SeatMeter taken={s.enrolledCount} capacity={s.capacity} />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
