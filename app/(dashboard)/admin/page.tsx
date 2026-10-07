import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  DollarSignIcon,
  GraduationCapIcon,
  HistoryIcon,
  LibraryIcon,
  PresentationIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LazyActivityChart, LazyBarListChart, LazyDonutChart } from "@/components/charts/lazy";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { serverApi } from "@/lib/api/server";
import type { AuditLog } from "@/lib/api/types";
import { formatMoney, formatRelative, humanize } from "@/lib/format";
import { semesterPhase } from "@/lib/semesters";

export const metadata: Metadata = { title: "Admin dashboard" };

const ENTITY_SERIES = [
  { key: "enrollment", entity: "Enrollment", label: "Enrollments & grades", color: "var(--chart-1)" },
  { key: "payment", entity: "Payment", label: "Payments", color: "var(--chart-2)" },
  { key: "user", entity: "User", label: "User changes", color: "var(--chart-3)" },
];

/** Audit-log events per day for the last 14 days, one series per entity. */
function activityByDay(logs: AuditLog[]) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - (13 - i));
    return d;
  });
  return days.map((day) => {
    const key = day.toISOString().slice(0, 10);
    const point: { day: string; [k: string]: string | number } = {
      day: day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    };
    for (const s of ENTITY_SERIES) {
      point[s.key] = logs.filter((l) => l.entity === s.entity && l.createdAt.slice(0, 10) === key).length;
    }
    return point;
  });
}

export default async function AdminOverviewPage() {
  const [stats, logs, sections, departments] = await Promise.all([
    serverApi.stats(),
    serverApi.auditLogs({ limit: 100 }),
    serverApi.sections(),
    serverApi.departments(),
  ]);

  const running = sections.filter((s) => semesterPhase(s.semester) === "current");
  const scope = running.length ? running : sections;
  const byDepartment = departments
    .map((d) => {
      const own = scope.filter((s) => s.course.departmentId === d.id);
      return {
        label: d.code,
        taken: own.reduce((sum, s) => sum + s.enrolledCount, 0),
        free: own.reduce((sum, s) => sum + Math.max(s.capacity - s.enrolledCount, 0), 0),
      };
    })
    .filter((d) => d.taken + d.free > 0);

  const invoiceTotal = stats.paidInvoices + stats.unpaidInvoices;

  return (
    <>
      <PageHeader
        eyebrow="Registrar's office"
        title="University at a glance"
        description="Live figures from the registration, grading and fee systems. Counts refresh every minute."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/audit-logs">
              <HistoryIcon /> Audit log
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={stats.users.STUDENT} hint={`${stats.users.INSTRUCTOR} instructors · ${stats.users.ADMIN} admins`} icon={GraduationCapIcon} />
        <StatCard label="Active enrollments" value={stats.activeEnrollments} hint={`${stats.sections} sections running`} icon={BookOpenCheckIcon} tone="info" />
        <StatCard label="Courses in catalogue" value={stats.courses} hint={`${departments.length} departments`} icon={LibraryIcon} tone="success" />
        <StatCard
          label="Tuition collected"
          value={formatMoney(stats.revenue)}
          hint={`${stats.paidInvoices} paid · ${stats.unpaidInvoices} outstanding`}
          icon={DollarSignIcon}
          tone="highlight"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Activity, last 14 days</CardTitle>
            <CardDescription>Enrollments, drops, grades, payments and account changes from the audit log.</CardDescription>
          </CardHeader>
          <CardContent>
            <LazyActivityChart data={activityByDay(logs.items)} series={ENTITY_SERIES} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">People</CardTitle>
            <CardDescription>Active accounts by role.</CardDescription>
          </CardHeader>
          <CardContent>
            <LazyDonutChart
              centerLabel="accounts"
              slices={[
                { key: "students", label: "Students", value: stats.users.STUDENT, color: "var(--chart-1)" },
                { key: "instructors", label: "Instructors", value: stats.users.INSTRUCTOR, color: "var(--chart-3)" },
                { key: "admins", label: "Admins", value: stats.users.ADMIN, color: "var(--chart-2)" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Seats by department</CardTitle>
            <CardDescription>
              {running.length ? "Sections in the semester currently running." : "All sections."} Seats taken vs free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LazyBarListChart
              data={byDepartment}
              series={[
                { key: "taken", label: "Seats taken", color: "var(--chart-1)" },
                { key: "free", label: "Seats free", color: "var(--chart-5)" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tuition invoices</CardTitle>
            <CardDescription>
              {invoiceTotal ? `${Math.round((stats.paidInvoices / invoiceTotal) * 100)}% of issued invoices are paid.` : "No invoices issued yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LazyBarListChart
              data={[
                { label: "Paid", count: stats.paidInvoices },
                { label: "Outstanding", count: stats.unpaidInvoices },
              ]}
              series={[{ key: "count", label: "Invoices", color: "var(--chart-2)" }]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>The latest recorded changes.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/audit-logs">
              View all <ArrowRightIcon />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {logs.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet. Enrollments, grades and payments will show up here.</p>
          ) : (
            <ul className="divide-y">
              {logs.items.slice(0, 6).map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <PresentationIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">
                      <span className="font-medium">{log.actor?.name ?? "System"}</span> · {humanize(log.action)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
