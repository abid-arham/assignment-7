import type { Metadata } from "next";
import { GraduationCapIcon, ScrollTextIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LazyGradeDistributionChart } from "@/components/charts/lazy";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { GradeBadge } from "@/components/shared/status-badge";
import { serverApi } from "@/lib/api/server";
import type { MyEnrollment } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Transcript" };

interface Term {
  name: string;
  startDate: string;
  attempts: MyEnrollment[];
}

const termGpa = (attempts: MyEnrollment[]) => {
  const credits = attempts.reduce((s, e) => s + e.section.course.credits, 0);
  const points = attempts.reduce((s, e) => s + e.section.course.credits * Number(e.gradePoint ?? 0), 0);
  return credits ? points / credits : 0;
};

export default async function TranscriptPage() {
  const [me, transcript, enrollments] = await Promise.all([
    serverApi.me(),
    serverApi.transcript(),
    serverApi.myEnrollments(),
  ]);

  // The transcript endpoint carries GPA and the retake policy (isCounted); enrollments add the term.
  const counted = new Set(
    transcript.courses.filter((c) => c.isCounted).map((c) => `${c.courseCode}|${c.enrolledAt}`),
  );
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const terms = Object.values(
    completed.reduce<Record<string, Term>>((acc, e) => {
      const s = e.section.semester;
      (acc[s.id] ??= { name: s.name, startDate: s.startDate, attempts: [] }).attempts.push(e);
      return acc;
    }, {}),
  ).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <PageHeader
        title="Academic transcript"
        description="Graded courses by term. On a retake only your best attempt counts toward GPA; every attempt stays on record."
        actions={<PrintButton label="Print transcript" />}
      />

      {completed.length === 0 ? (
        <EmptyState
          icon={ScrollTextIcon}
          title="No graded courses yet"
          description="Your transcript fills in as instructors submit final grades."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{me.name}</CardTitle>
                  <CardDescription>
                    {me.studentCode ?? me.email} · issued {formatDate(new Date())}
                  </CardDescription>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Cumulative GPA</p>
                    <p className="font-heading text-3xl font-semibold tabular-nums">{transcript.gpa.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Credits earned</p>
                    <p className="font-heading text-3xl font-semibold tabular-nums">{transcript.totalCredits}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {terms.map((term) => (
              <Card key={term.name} className="gap-0 py-0">
                <div className="flex items-center justify-between border-b px-5 py-3">
                  <h2 className="text-base font-semibold">{term.name}</h2>
                  <span className="text-sm text-muted-foreground">
                    Term GPA <span className="font-medium text-foreground tabular-nums">{termGpa(term.attempts).toFixed(2)}</span>
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-5">Course</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="hidden px-5 text-right sm:table-cell">Grade points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {term.attempts.map((e) => {
                      const isCounted = counted.has(`${e.section.course.code}|${e.enrolledAt}`);
                      return (
                        <TableRow key={e.id} className={isCounted ? undefined : "text-muted-foreground"}>
                          <TableCell className="px-5">
                            <span className="font-medium">{e.section.course.code}</span>{" "}
                            <span className="hidden sm:inline">{e.section.course.title}</span>
                            {!isCounted && (
                              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">Replaced by retake</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">{e.section.course.credits}</TableCell>
                          <TableCell className="text-center">
                            <GradeBadge grade={e.grade} />
                          </TableCell>
                          <TableCell className="hidden px-5 text-right tabular-nums sm:table-cell">
                            {Number(e.gradePoint ?? 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="px-5">Term total</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {term.attempts.reduce((s, e) => s + e.section.course.credits, 0)}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableFooter>
                </Table>
              </Card>
            ))}
          </div>

          <Card className="no-print h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCapIcon className="size-5 text-primary" /> Grade distribution
              </CardTitle>
              <CardDescription>All graded attempts across your terms.</CardDescription>
            </CardHeader>
            <CardContent>
              <LazyGradeDistributionChart grades={completed.map((e) => e.grade)} label="Courses" />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
