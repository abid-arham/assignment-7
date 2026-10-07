import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClipboardListIcon,
  CreditCardIcon,
  GaugeIcon,
  GraduationCapIcon,
  ScrollTextIcon,
  WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { GradeBadge, StatusBadge } from "@/components/shared/status-badge";
import { serverApi } from "@/lib/api/server";
import { formatDate, formatMoney, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Student overview" };

export default async function StudentOverviewPage() {
  const [me, enrollments, transcript, invoices] = await Promise.all([
    serverApi.me(),
    serverApi.myEnrollments(),
    serverApi.transcript(),
    serverApi.myInvoices(),
  ]);

  const active = enrollments.filter((e) => e.status === "ENROLLED");
  const activeCredits = active.reduce((sum, e) => sum + e.section.course.credits, 0);
  const unpaid = invoices.filter((i) => i.status === "UNPAID");
  const balance = unpaid.reduce((sum, i) => sum + Number(i.amount), 0);
  const recentGrades = enrollments
    .filter((e) => e.status === "COMPLETED")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const firstName = me.name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={me.studentCode ?? "Student"}
        title={`Welcome back, ${firstName}`}
        description="Your current courses, grades and fees at a glance."
        actions={
          <Button asChild>
            <Link href="/dashboard/register">
              <ClipboardListIcon /> Register for courses
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cumulative GPA"
          value={transcript.totalCredits ? transcript.gpa.toFixed(2) : "—"}
          hint={transcript.totalCredits ? `Across ${plural(transcript.totalCredits, "credit")}` : "No graded courses yet"}
          icon={GaugeIcon}
        />
        <StatCard
          label="Active courses"
          value={active.length}
          hint={plural(activeCredits, "credit") + " this term"}
          icon={BookOpenIcon}
          tone="info"
        />
        <StatCard
          label="Credits earned"
          value={transcript.totalCredits}
          hint={`${transcript.courses.length} graded attempts`}
          icon={GraduationCapIcon}
          tone="success"
        />
        <StatCard
          label="Outstanding balance"
          value={formatMoney(balance)}
          hint={unpaid.length ? plural(unpaid.length, "unpaid invoice") : "You're all paid up"}
          icon={WalletIcon}
          tone={balance > 0 ? "highlight" : "success"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Current courses</CardTitle>
            <CardDescription>Sections you&apos;re enrolled in right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <EmptyState
                icon={BookOpenIcon}
                title="You're not enrolled in anything yet"
                description="Browse open sections for this semester and build your registration plan."
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/register">Find sections</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y">
                {active.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        <span className="text-primary">{e.section.course.code}</span> · {e.section.course.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Section {e.section.sectionCode} · {e.section.semester.name} ·{" "}
                        {plural(e.section.course.credits, "credit")}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent grades</CardTitle>
              <CardDescription>The latest results posted by your instructors.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grades have been posted yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentGrades.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{e.section.course.code}</span>{" "}
                        <span className="text-muted-foreground">{e.section.semester.name}</span>
                      </span>
                      <GradeBadge grade={e.grade} />
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="link" asChild className="mt-3 px-0">
                <Link href="/dashboard/transcript">
                  <ScrollTextIcon /> Full transcript <ArrowRightIcon />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tuition</CardTitle>
              <CardDescription>
                {unpaid.length
                  ? `Due: ${unpaid.map((i) => `${i.semester.name} (${formatMoney(i.amount)})`).join(", ")}`
                  : invoices.length
                    ? `Last payment ${formatDate(invoices.find((i) => i.paidAt)?.paidAt)}`
                    : "Generate an invoice once your registration is final."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant={balance > 0 ? "default" : "outline"} asChild className="w-full">
                <Link href="/dashboard/payments">
                  <CreditCardIcon /> {balance > 0 ? "Pay tuition" : "View invoices"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
