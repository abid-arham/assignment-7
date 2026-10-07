import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ClipboardCheckIcon, LayersIcon, PenLineIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SeatMeter } from "@/components/shared/seat-meter";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { serverApi } from "@/lib/api/server";
import { formatDateRange, plural } from "@/lib/format";
import { semesterPhase } from "@/lib/semesters";
import { mapWithLimit, sortSections, summarizeSection } from "@/lib/teaching";

export const metadata: Metadata = { title: "My sections" };

export default async function InstructorHomePage() {
  const [me, sections] = await Promise.all([serverApi.me(), serverApi.mySections()]);
  // One roster request per section, a few at a time — instructors teach a handful of sections.
  const summaries = sortSections(
    await mapWithLimit(sections, 3, async (s) => summarizeSection(s, await serverApi.roster(s.id))),
  );

  const current = summaries.filter((s) => semesterPhase(s.section.semester) !== "past");
  const students = current.reduce((sum, s) => sum + s.roster.length, 0);
  const ungraded = summaries.reduce((sum, s) => sum + s.ungraded, 0);
  const graded = summaries.reduce((sum, s) => sum + s.graded, 0);

  const bySemester = Object.values(
    summaries.reduce<Record<string, typeof summaries>>((acc, s) => {
      (acc[s.section.semesterId] ??= []).push(s);
      return acc;
    }, {}),
  );

  return (
    <>
      <PageHeader
        eyebrow="Instructor"
        title={`Good to see you, ${me.name}`}
        description="Your sections by semester. Open a roster to enter final grades."
        actions={
          <Button variant="outline" asChild>
            <Link href="/instructor/analytics">Grade analytics</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sections this term" value={current.length} hint={`${sections.length} in total`} icon={LayersIcon} />
        <StatCard label="Students this term" value={students} hint="Enrolled or graded" icon={UsersIcon} tone="info" />
        <StatCard
          label="Grades to submit"
          value={ungraded}
          hint={ungraded ? "Students still enrolled" : "All caught up"}
          icon={PenLineIcon}
          tone={ungraded ? "highlight" : "success"}
        />
        <StatCard label="Grades submitted" value={graded} hint="Across every term" icon={ClipboardCheckIcon} tone="success" />
      </div>

      {summaries.length === 0 ? (
        <EmptyState
          icon={LayersIcon}
          title="No sections assigned yet"
          description="When the registrar assigns you to a section it will appear here with its roster."
        />
      ) : (
        bySemester.map((group) => {
          const semester = group[0]!.section.semester;
          return (
            <section key={semester.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-xl font-semibold">{semester.name}</h2>
                <span className="text-sm text-muted-foreground">
                  {formatDateRange(semester.startDate, semester.endDate)}
                </span>
                <StatusBadge status={semester.enrollmentOpen ? "OPEN" : "CLOSED"} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.map(({ section, roster, ungraded: toGrade, averageGradePoint }) => (
                  <Card key={section.id} size="sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base">
                            {section.course.code}-{section.sectionCode}
                          </CardTitle>
                          <p className="truncate text-sm text-muted-foreground">{section.course.title}</p>
                        </div>
                        <Badge variant="secondary">{plural(section.course.credits, "credit")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <SeatMeter taken={section.enrolledCount} capacity={section.capacity} />
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-muted px-2 py-0.5">{plural(roster.length, "student")}</span>
                        {toGrade > 0 && (
                          <span className="rounded-full bg-warning/20 px-2 py-0.5">{toGrade} to grade</span>
                        )}
                        {averageGradePoint !== null && (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">
                            Avg {averageGradePoint.toFixed(2)} GP
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant={toGrade ? "default" : "outline"} size="sm" className="w-full">
                        <Link href={`/instructor/sections/${section.id}`}>
                          {toGrade ? "Enter grades" : "View roster"} <ArrowRightIcon />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
