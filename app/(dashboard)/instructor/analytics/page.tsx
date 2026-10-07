import type { Metadata } from "next";
import { BarChart3Icon, GaugeIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LazyBarListChart, LazyGradeDistributionChart } from "@/components/charts/lazy";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { serverApi } from "@/lib/api/server";
import { mapWithLimit, sectionLabel, sortSections, summarizeSection } from "@/lib/teaching";

export const metadata: Metadata = { title: "Grade analytics" };

export default async function InstructorAnalyticsPage() {
  const sections = await serverApi.mySections();
  const summaries = sortSections(
    await mapWithLimit(sections, 3, async (s) => summarizeSection(s, await serverApi.roster(s.id))),
  );

  const graded = summaries.flatMap((s) => s.roster.filter((e) => e.status === "COMPLETED"));
  const points = graded.map((e) => Number(e.gradePoint ?? 0));
  const average = points.length ? points.reduce((a, b) => a + b, 0) / points.length : null;
  const passRate = points.length ? points.filter((p) => p > 0).length / points.length : null;
  const students = new Set(summaries.flatMap((s) => s.roster.map((e) => e.studentId))).size;

  const gradedSections = summaries.filter((s) => s.averageGradePoint !== null);
  const avgData = gradedSections.map((s) => ({
    label: sectionLabel(s.section),
    average: Number(s.averageGradePoint!.toFixed(2)),
  }));
  const fillData = summaries.map((s) => ({
    label: sectionLabel(s.section),
    taken: s.section.enrolledCount,
    free: Math.max(s.section.capacity - s.section.enrolledCount, 0),
  }));

  return (
    <>
      <PageHeader
        title="Grade analytics"
        description="How your students are doing across every section you've taught, computed from your rosters."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students taught" value={students} hint={`${summaries.length} sections`} icon={UsersIcon} />
        <StatCard label="Grades submitted" value={graded.length} icon={BarChart3Icon} tone="info" />
        <StatCard
          label="Average grade point"
          value={average === null ? "—" : average.toFixed(2)}
          hint="Out of 4.00"
          icon={GaugeIcon}
          tone="success"
        />
        <StatCard
          label="Pass rate"
          value={passRate === null ? "—" : `${Math.round(passRate * 100)}%`}
          hint="D or better"
          icon={TrophyIcon}
          tone="highlight"
        />
      </div>

      {summaries.length === 0 ? (
        <EmptyState icon={BarChart3Icon} title="Nothing to analyse yet" description="Analytics appear once you're assigned sections." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grade distribution</CardTitle>
              <CardDescription>Every final grade you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              {graded.length ? (
                <LazyGradeDistributionChart grades={graded.map((e) => e.grade)} />
              ) : (
                <p className="text-sm text-muted-foreground">No grades submitted yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average grade point by section</CardTitle>
              <CardDescription>Sections with at least one graded student.</CardDescription>
            </CardHeader>
            <CardContent>
              {avgData.length ? (
                <LazyBarListChart
                  data={avgData}
                  series={[{ key: "average", label: "Average GP", color: "var(--chart-1)" }]}
                  max={4}
                  decimals={2}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No graded sections yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Seat fill by section</CardTitle>
              <CardDescription>Seats taken versus seats still free.</CardDescription>
            </CardHeader>
            <CardContent>
              <LazyBarListChart
                data={fillData}
                series={[
                  { key: "taken", label: "Seats taken", color: "var(--chart-1)" },
                  { key: "free", label: "Seats free", color: "var(--chart-5)" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
