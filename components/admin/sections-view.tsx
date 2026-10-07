"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayersIcon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SeatMeter } from "@/components/shared/seat-meter";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { getErrorMessage, getFieldErrors, isApiError } from "@/lib/api/errors";
import { queries } from "@/lib/api/queries";
import type { SectionWithRelations } from "@/lib/api/types";
import { parseSearch, sectionsSearch } from "@/lib/search-params";
import {
  sectionEditSchema,
  sectionSchema,
  type SectionEditInput,
  type SectionFormInput,
} from "@/lib/validations/admin";

const PAGE_SIZE = 10;
export const INSTRUCTORS = { role: "INSTRUCTOR", limit: 100 } as const;

/** Shared lookups for the filters and dialogs. */
function useLookups() {
  const courses = useQuery(queries.courses(api, ALL_COURSES)).data?.items ?? [];
  const semesters = useQuery(queries.semesters(api)).data ?? [];
  const instructors = useQuery(queries.users(api, INSTRUCTORS)).data?.items ?? [];
  return { courses, semesters, instructors };
}

function LookupSelect({
  id,
  value,
  onChange,
  placeholder,
  options,
  invalid,
  className = "w-full",
  allLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  invalid?: boolean;
  className?: string;
  allLabel?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={className} aria-invalid={invalid} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateSectionDialog({ open, onOpenChange, defaults }: { open: boolean; onOpenChange: (o: boolean) => void; defaults: Partial<SectionFormInput> }) {
  const queryClient = useQueryClient();
  const { courses, semesters, instructors } = useLookups();
  const form = useForm<SectionFormInput>({
    resolver: zodResolver(sectionSchema),
    mode: "onTouched",
    defaultValues: { courseId: "", semesterId: "", instructorId: "", sectionCode: "A", capacity: 30, ...defaults },
  });
  const { errors } = form.formState;

  const create = useMutation({
    mutationFn: (values: SectionFormInput) => api.createSection({ ...values, sectionCode: values.sectionCode.toUpperCase() }),
    onSuccess: () => {
      toast.success("Section created");
      void queryClient.invalidateQueries({ queryKey: ["sections"] });
      onOpenChange(false);
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 409) form.setError("sectionCode", { message: "This course already has that section in this semester" });
      else applyServerErrors(form.setError, getFieldErrors(error), ["courseId", "semesterId", "instructorId", "sectionCode", "capacity"]);
      toast.error("Couldn't create the section", { description: getErrorMessage(error) });
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New section"
      description="Offer a course in a semester with an instructor and a seat limit."
      onSubmit={form.handleSubmit((v) => create.mutate(v))}
      pending={create.isPending}
      submitLabel="Create section"
    >
      <Field data-invalid={!!errors.courseId}>
        <FieldLabel htmlFor="sec-course">Course</FieldLabel>
        <Controller
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <LookupSelect id="sec-course" value={field.value} onChange={field.onChange} placeholder="Choose a course" invalid={!!errors.courseId}
              options={courses.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }))} />
          )}
        />
        <FieldError errors={[errors.courseId]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.semesterId}>
          <FieldLabel htmlFor="sec-semester">Semester</FieldLabel>
          <Controller
            control={form.control}
            name="semesterId"
            render={({ field }) => (
              <LookupSelect id="sec-semester" value={field.value} onChange={field.onChange} placeholder="Choose a semester" invalid={!!errors.semesterId}
                options={semesters.map((s) => ({ value: s.id, label: s.name }))} />
            )}
          />
          <FieldError errors={[errors.semesterId]} />
        </Field>
        <Field data-invalid={!!errors.instructorId}>
          <FieldLabel htmlFor="sec-instructor">Instructor</FieldLabel>
          <Controller
            control={form.control}
            name="instructorId"
            render={({ field }) => (
              <LookupSelect id="sec-instructor" value={field.value} onChange={field.onChange} placeholder="Choose an instructor" invalid={!!errors.instructorId}
                options={instructors.map((u) => ({ value: u.id, label: u.name }))} />
            )}
          />
          <FieldError errors={[errors.instructorId]} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors.sectionCode}>
          <FieldLabel htmlFor="sec-code">Section code</FieldLabel>
          <Input id="sec-code" className="uppercase" aria-invalid={!!errors.sectionCode} {...form.register("sectionCode")} />
          <FieldError errors={[errors.sectionCode]} />
        </Field>
        <Field data-invalid={!!errors.capacity}>
          <FieldLabel htmlFor="sec-capacity">Capacity</FieldLabel>
          <Input id="sec-capacity" type="number" min={1} aria-invalid={!!errors.capacity} {...form.register("capacity", { valueAsNumber: true })} />
          <FieldError errors={[errors.capacity]} />
        </Field>
      </div>
    </FormDialog>
  );
}

function EditSectionDialog({ section, onClose }: { section: SectionWithRelations; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { instructors } = useLookups();
  const form = useForm<SectionEditInput>({
    resolver: zodResolver(sectionEditSchema(section.enrolledCount)),
    mode: "onTouched",
    defaultValues: { instructorId: section.instructorId, capacity: section.capacity },
  });
  const { errors } = form.formState;

  const save = useMutation({
    mutationFn: (values: SectionEditInput) => api.updateSection(section.id, values),
    onSuccess: () => {
      toast.success(`${section.course.code}-${section.sectionCode} updated`);
      void queryClient.invalidateQueries({ queryKey: ["sections"] });
      onClose();
    },
    onError: (error) => {
      applyServerErrors(form.setError, getFieldErrors(error), ["instructorId", "capacity"]);
      toast.error("Couldn't update the section", { description: getErrorMessage(error) });
    },
  });

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit ${section.course.code}-${section.sectionCode}`}
      description={`${section.semester.name} · ${section.enrolledCount} of ${section.capacity} seats taken`}
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
      pending={save.isPending}
      submitLabel="Save changes"
    >
      <Field data-invalid={!!errors.instructorId}>
        <FieldLabel htmlFor="edit-instructor">Instructor</FieldLabel>
        <Controller
          control={form.control}
          name="instructorId"
          render={({ field }) => (
            <LookupSelect id="edit-instructor" value={field.value} onChange={field.onChange} placeholder="Choose an instructor"
              options={instructors.map((u) => ({ value: u.id, label: u.name }))} />
          )}
        />
        <FieldError errors={[errors.instructorId]} />
      </Field>
      <Field data-invalid={!!errors.capacity}>
        <FieldLabel htmlFor="edit-capacity">Capacity</FieldLabel>
        <Input id="edit-capacity" type="number" min={Math.max(1, section.enrolledCount)} className="w-32" aria-invalid={!!errors.capacity} {...form.register("capacity", { valueAsNumber: true })} />
        <FieldError errors={[errors.capacity]} />
      </Field>
    </FormDialog>
  );
}

export function SectionsView() {
  const { searchParams, setParams } = useQueryParams();
  const filters = parseSearch(sectionsSearch, searchParams);
  const { page, ...apiFilters } = filters;
  const { data, isPending, isFetching } = useQuery(queries.sections(api, apiFilters));
  const { courses, semesters, instructors } = useLookups();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SectionWithRelations | null>(null);

  // The API returns all matching sections; paginate client-side (still reflected in the URL).
  const sorted = [...(data ?? [])].sort(
    (a, b) =>
      b.semester.startDate.localeCompare(a.semester.startDate) ||
      a.course.code.localeCompare(b.course.code) ||
      a.sectionCode.localeCompare(b.sectionCode),
  );
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<SectionWithRelations>[] = [
    {
      id: "course",
      header: "Section",
      cell: (s) => (
        <div>
          <Link href={`/admin/courses/${s.courseId}`} className="font-medium text-primary hover:underline">
            {s.course.code}-{s.sectionCode}
          </Link>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{s.course.title}</p>
        </div>
      ),
    },
    { id: "semester", header: "Semester", cell: (s) => s.semester.name, className: "hidden sm:table-cell" },
    { id: "instructor", header: "Instructor", cell: (s) => s.instructor.name, className: "hidden md:table-cell" },
    { id: "seats", header: "Seats", cell: (s) => <SeatMeter taken={s.enrolledCount} capacity={s.capacity} className="w-36" /> },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (s) => (
        <Button variant="ghost" size="sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.course.code}-${s.sectionCode}`}>
          <PencilIcon /> <span className="hidden sm:inline">Edit</span>
        </Button>
      ),
    },
  ];

  const filterValue = (v?: string) => v ?? "all";
  const setFilter = (key: "semesterId" | "courseId" | "instructorId") => (v: string) => setParams({ [key]: v === "all" ? null : v });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <LookupSelect value={filterValue(filters.semesterId)} onChange={setFilter("semesterId")} placeholder="Semester" allLabel="All semesters" className="w-full sm:w-44"
          options={semesters.map((s) => ({ value: s.id, label: s.name }))} />
        <LookupSelect value={filterValue(filters.courseId)} onChange={setFilter("courseId")} placeholder="Course" allLabel="All courses" className="w-full sm:w-56"
          options={courses.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }))} />
        <LookupSelect value={filterValue(filters.instructorId)} onChange={setFilter("instructorId")} placeholder="Instructor" allLabel="All instructors" className="w-full sm:w-48"
          options={instructors.map((u) => ({ value: u.id, label: u.name }))} />
        <Button className="sm:ml-auto" onClick={() => setCreating(true)}>
          <PlusIcon /> New section
        </Button>
      </div>

      <DataTable
        caption="Sections"
        columns={columns}
        rows={data ? rows : undefined}
        getRowId={(s) => s.id}
        isLoading={isPending}
        isFetching={isFetching}
        empty={
          <EmptyState
            icon={LayersIcon}
            title="No sections match"
            description="Change the filters or create a section for this semester."
            action={<Button size="sm" onClick={() => setCreating(true)}>New section</Button>}
          />
        }
      />
      <PaginationBar page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={(p) => setParams({ page: p })} />

      {creating && (
        <CreateSectionDialog
          open
          onOpenChange={setCreating}
          defaults={{ courseId: filters.courseId ?? "", semesterId: filters.semesterId ?? "", instructorId: filters.instructorId ?? "" }}
        />
      )}
      {editing && <EditSectionDialog section={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
