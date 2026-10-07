"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, LibraryIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseEditDialog } from "@/components/admin/course-edit-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { queries } from "@/lib/api/queries";
import type { Course } from "@/lib/api/types";
import { courseCatalogSearch, parseSearch } from "@/lib/search-params";

export const ADMIN_COURSES_PAGE_SIZE = 10;

const SORTS = [
  { value: "title", label: "Title A–Z" },
  { value: "code", label: "Code" },
  { value: "createdAt", label: "Oldest first" },
] as const;

export function CoursesView() {
  const queryClient = useQueryClient();
  const { searchParams, setParams } = useQueryParams();
  const filters = parseSearch(courseCatalogSearch, searchParams);
  const { data, isPending, isFetching } = useQuery(
    queries.courses(api, { ...filters, limit: ADMIN_COURSES_PAGE_SIZE }),
  );
  const { data: departments } = useQuery(queries.departments(api));
  const deptName = (id: string) => departments?.find((d) => d.id === id)?.code ?? "—";

  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);

  const remove = useMutation({
    mutationFn: (course: Course) => api.deleteCourse(course.id),
    onSuccess: (_d, course) => {
      toast.success(`${course.code} removed from the catalogue`);
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => toast.error("Couldn't delete the course", { description: getErrorMessage(error) }),
  });

  const columns: Column<Course>[] = [
    {
      id: "code",
      header: "Code",
      cell: (c) => (
        <Link href={`/admin/courses/${c.id}`} className="font-medium text-primary hover:underline">
          {c.code}
        </Link>
      ),
    },
    {
      id: "title",
      header: "Title",
      cell: (c) => (
        <div className="min-w-0 max-w-72">
          <p className="truncate font-medium">{c.title}</p>
          <p className="truncate text-xs text-muted-foreground">{c.description ?? "No description yet"}</p>
        </div>
      ),
    },
    { id: "dept", header: "Dept.", cell: (c) => <Badge variant="outline">{deptName(c.departmentId)}</Badge>, className: "hidden sm:table-cell" },
    { id: "credits", header: "Credits", cell: (c) => c.credits, align: "center", className: "hidden md:table-cell" },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.code}`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${c.id}`}>
                <EyeIcon /> View & prerequisites
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditing(c)}>
              <PencilIcon /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c)}>
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={filters.q ?? ""}
          onSearch={(q) => setParams({ q }, { replace: true })}
          placeholder="Search code or title"
          label="Search courses"
        />
        <Select value={filters.departmentId ?? "all"} onValueChange={(v) => setParams({ departmentId: v === "all" ? null : v })}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments?.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.sortBy} onValueChange={(sortBy) => setParams({ sortBy: sortBy === "title" ? null : sortBy })}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Sort courses">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        caption="Courses"
        columns={columns}
        rows={data?.items}
        getRowId={(c) => c.id}
        isLoading={isPending}
        isFetching={isFetching}
        empty={
          <EmptyState
            icon={LibraryIcon}
            title="No courses found"
            description="Nothing matches these filters. Clear them or add a new course."
            action={
              <Button asChild size="sm">
                <Link href="/admin/courses/new">New course</Link>
              </Button>
            }
          />
        }
      />
      {data && (
        <PaginationBar page={data.meta.page} pageSize={data.meta.limit} total={data.meta.total} onPageChange={(page) => setParams({ page })} />
      )}

      {editing && <CourseEditDialog course={editing} open onOpenChange={(open) => !open && setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        description="The course is hidden from the catalogue and registration. Past enrollments and grades are kept."
        confirmLabel="Delete course"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
