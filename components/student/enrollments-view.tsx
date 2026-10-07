"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { GradeBadge, StatusBadge } from "@/components/shared/status-badge";
import { useDropEnrollment } from "@/hooks/use-student-mutations";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { queries } from "@/lib/api/queries";
import type { MyEnrollment } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { enrollmentsSearch, parseSearch } from "@/lib/search-params";

const TABS = [
  { value: "all", label: "All" },
  { value: "ENROLLED", label: "Enrolled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
] as const;

export function EnrollmentsView() {
  const { searchParams, setParams } = useQueryParams();
  const { status } = parseSearch(enrollmentsSearch, searchParams);
  const { data, isPending } = useQuery(queries.myEnrollments(api));
  const drop = useDropEnrollment();

  const rows = data?.filter((e) => status === "all" || e.status === status);
  const count = (value: string) => data?.filter((e) => value === "all" || e.status === value).length ?? 0;

  const columns: Column<MyEnrollment>[] = [
    {
      id: "course",
      header: "Course",
      cell: (e) => (
        <div className="min-w-0">
          <Link href={`/courses/${e.section.courseId}`} className="font-medium hover:underline">
            {e.section.course.code}
          </Link>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{e.section.course.title}</p>
        </div>
      ),
    },
    { id: "semester", header: "Semester", cell: (e) => e.section.semester.name, className: "hidden sm:table-cell" },
    { id: "section", header: "Section", cell: (e) => e.section.sectionCode, className: "hidden md:table-cell" },
    { id: "credits", header: "Credits", cell: (e) => e.section.course.credits, align: "center", className: "hidden md:table-cell" },
    { id: "status", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
    { id: "grade", header: "Grade", cell: (e) => <GradeBadge grade={e.grade} />, align: "center" },
    {
      id: "date",
      header: "Enrolled",
      cell: (e) => (e.status === "DROPPED" ? `Dropped ${formatDate(e.droppedAt)}` : formatDate(e.enrolledAt)),
      className: "hidden lg:table-cell text-muted-foreground",
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (e) =>
        e.status === "ENROLLED" ? (
          <ConfirmDialog
            title={`Drop ${e.section.course.code}?`}
            description={`You'll give up your seat in ${e.section.course.code} section ${e.section.sectionCode}. If the section fills up you may not get it back.`}
            confirmLabel="Drop course"
            destructive
            onConfirm={() => drop.mutate(e)}
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <LogOutIcon /> Drop
              </Button>
            }
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(value) => setParams({ status: value === "all" ? null : value })}>
        <TabsList className="max-w-full overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                {count(tab.value)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        caption="Your enrollments"
        columns={columns}
        rows={rows}
        getRowId={(e) => e.id}
        isLoading={isPending}
        empty={
          <EmptyState
            icon={BookOpenIcon}
            title={status === "all" ? "No enrollments yet" : `No ${status.toLowerCase()} courses`}
            description={
              status === "all"
                ? "Once you register for a section it will show up here."
                : "Try another tab to see the rest of your history."
            }
            action={
              status === "all" ? (
                <Button asChild size="sm">
                  <Link href="/dashboard/register">Register for courses</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
