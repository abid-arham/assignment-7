"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyGradeDistributionChart } from "@/components/charts/lazy";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { GradeBadge, StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { queries, queryKeys } from "@/lib/api/queries";
import { GRADES, type Grade, type RosterEntry } from "@/lib/api/types";
import { parseSearch, rosterSearch } from "@/lib/search-params";

const GRADE_POINTS: Record<Grade, number> = {
  "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, D: 1, F: 0,
};

/** Grade submission is optimistic: the row shows the grade at once and reverts if the API refuses. */
function useSubmitGrade(sectionId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.roster(sectionId);

  return useMutation({
    mutationFn: ({ entry, grade }: { entry: RosterEntry; grade: Grade }) => api.submitGrade(entry.id, grade),
    onMutate: async ({ entry, grade }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<RosterEntry[]>(key);
      queryClient.setQueryData<RosterEntry[]>(key, (rows) =>
        rows?.map((r) =>
          r.id === entry.id ? { ...r, status: "COMPLETED", grade, gradePoint: String(GRADE_POINTS[grade]) } : r,
        ),
      );
      return { previous };
    },
    onError: (error, { entry }, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast.error(`Couldn't grade ${entry.student.name}`, { description: getErrorMessage(error) });
    },
    onSuccess: (_d, { entry, grade }) => toast.success(`${entry.student.name}: ${grade} submitted`),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });
}

function GradeCell({ entry, sectionId }: { entry: RosterEntry; sectionId: string }) {
  const [grade, setGrade] = useState<Grade | "">("");
  const submit = useSubmitGrade(sectionId);

  if (entry.status !== "ENROLLED") return <GradeBadge grade={entry.grade} />;

  return (
    <div className="flex items-center justify-end gap-2">
      <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
        <SelectTrigger size="sm" className="w-20" aria-label={`Grade for ${entry.student.name}`}>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {GRADES.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ConfirmDialog
        title={`Submit ${grade} for ${entry.student.name}?`}
        description="Final grades can't be edited after submission. The student's transcript and GPA update immediately."
        confirmLabel="Submit grade"
        onConfirm={() => grade && submit.mutate({ entry, grade })}
        trigger={
          <Button size="sm" disabled={!grade || submit.isPending} aria-label={`Submit grade for ${entry.student.name}`}>
            <CheckIcon /> <span className="hidden sm:inline">Submit</span>
          </Button>
        }
      />
    </div>
  );
}

export function RosterView({ sectionId }: { sectionId: string }) {
  const { searchParams, setParams } = useQueryParams();
  const { q, status } = parseSearch(rosterSearch, searchParams);
  const { data, isPending, isFetching } = useQuery(queries.roster(api, sectionId));

  const needle = q?.toLowerCase();
  const rows = data
    ?.filter((e) => status === "all" || (status === "graded" ? e.status === "COMPLETED" : e.status === "ENROLLED"))
    .filter(
      (e) =>
        !needle ||
        e.student.name.toLowerCase().includes(needle) ||
        e.student.email.toLowerCase().includes(needle) ||
        e.student.studentCode?.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.student.name.localeCompare(b.student.name));
  const graded = data?.filter((e) => e.status === "COMPLETED") ?? [];

  const columns: Column<RosterEntry>[] = [
    {
      id: "student",
      header: "Student",
      cell: (e) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={e.student.name} size="md" />
          <div className="min-w-0">
            <p className="font-medium">{e.student.name}</p>
            <p className="truncate text-xs text-muted-foreground">{e.student.email}</p>
          </div>
        </div>
      ),
    },
    { id: "code", header: "Student ID", cell: (e) => e.student.studentCode ?? "—", className: "hidden md:table-cell font-mono text-xs" },
    { id: "status", header: "Status", cell: (e) => <StatusBadge status={e.status} />, className: "hidden sm:table-cell" },
    { id: "grade", header: "Final grade", cell: (e) => <GradeCell entry={e} sectionId={sectionId} />, align: "right" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={(v) => setParams({ status: v === "all" ? null : v })}>
            <TabsList>
              <TabsTrigger value="all">All ({data?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="ungraded">To grade ({(data?.length ?? 0) - graded.length})</TabsTrigger>
              <TabsTrigger value="graded">Graded ({graded.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <SearchInput
            value={q ?? ""}
            onSearch={(value) => setParams({ q: value }, { replace: true })}
            placeholder="Name, email or ID"
            label="Search students"
          />
        </div>
        <DataTable
          caption="Class roster"
          columns={columns}
          rows={rows}
          getRowId={(e) => e.id}
          isLoading={isPending}
          isFetching={isFetching}
          empty={
            <EmptyState
              icon={UsersIcon}
              title={data?.length ? "No students match" : "No students enrolled yet"}
              description={
                data?.length
                  ? "Try a different search or tab."
                  : "Students appear here as soon as they register for this section."
              }
            />
          }
        />
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Grade distribution</CardTitle>
          <CardDescription>
            {graded.length
              ? `${graded.length} graded · average ${(graded.reduce((s, e) => s + Number(e.gradePoint ?? 0), 0) / graded.length).toFixed(2)} GP`
              : "Appears once you submit grades."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LazyGradeDistributionChart grades={graded.map((e) => e.grade)} />
        </CardContent>
      </Card>
    </div>
  );
}
