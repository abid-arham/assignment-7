"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRangeIcon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { api } from "@/lib/api/client";
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors";
import { queries, queryKeys } from "@/lib/api/queries";
import type { Semester } from "@/lib/api/types";
import { formatDateRange, formatMoney } from "@/lib/format";
import { semesterPhase } from "@/lib/semesters";
import { semesterSchema, type SemesterFormInput } from "@/lib/validations/admin";

const PHASE = {
  upcoming: { label: "Upcoming", className: "bg-info/15 text-info" },
  current: { label: "In session", className: "bg-success/15 text-success" },
  past: { label: "Finished", className: "bg-muted text-muted-foreground" },
} as const;

function SemesterDialog({ semester, open, onOpenChange }: { semester?: Semester; open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<SemesterFormInput>({
    resolver: zodResolver(semesterSchema),
    mode: "onTouched",
    values: {
      name: semester?.name ?? "",
      startDate: semester?.startDate.slice(0, 10) ?? "",
      endDate: semester?.endDate.slice(0, 10) ?? "",
      tuitionPerCredit: semester ? Number(semester.tuitionPerCredit) : 50,
      enrollmentOpen: semester?.enrollmentOpen ?? false,
    },
  });
  const { errors } = form.formState;

  const save = useMutation({
    mutationFn: async (values: SemesterFormInput) => {
      if (semester) return api.updateSemester(semester.id, values);
      // The API creates semesters closed; open enrollment right away if asked.
      const created = await api.createSemester({ ...values, enrollmentOpen: undefined });
      return values.enrollmentOpen ? api.updateSemester(created.id, { enrollmentOpen: true }) : created;
    },
    onSuccess: (saved) => {
      toast.success(semester ? `${saved.name} updated` : `${saved.name} created`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
      onOpenChange(false);
    },
    onError: (error) => {
      applyServerErrors(form.setError, getFieldErrors(error), ["name", "startDate", "endDate", "tuitionPerCredit"]);
      toast.error("Couldn't save the semester", { description: getErrorMessage(error) });
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={semester ? `Edit ${semester.name}` : "New semester"}
      description="Tuition is billed per credit at this semester's rate."
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
      pending={save.isPending}
      submitLabel={semester ? "Save changes" : "Create semester"}
    >
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="sem-name">Name</FieldLabel>
        <Input id="sem-name" placeholder="Fall 2027" aria-invalid={!!errors.name} {...form.register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.startDate}>
          <FieldLabel htmlFor="sem-start">Starts</FieldLabel>
          <Input id="sem-start" type="date" aria-invalid={!!errors.startDate} {...form.register("startDate")} />
          <FieldError errors={[errors.startDate]} />
        </Field>
        <Field data-invalid={!!errors.endDate}>
          <FieldLabel htmlFor="sem-end">Ends</FieldLabel>
          <Input id="sem-end" type="date" aria-invalid={!!errors.endDate} {...form.register("endDate", { deps: ["startDate"] })} />
          <FieldError errors={[errors.endDate]} />
        </Field>
      </div>
      <Field data-invalid={!!errors.tuitionPerCredit}>
        <FieldLabel htmlFor="sem-tuition">Tuition per credit (USD)</FieldLabel>
        <Input
          id="sem-tuition"
          type="number"
          step="0.01"
          min={0}
          className="w-36"
          aria-invalid={!!errors.tuitionPerCredit}
          {...form.register("tuitionPerCredit", { valueAsNumber: true })}
        />
        <FieldError errors={[errors.tuitionPerCredit]} />
      </Field>
      <Field orientation="horizontal">
        <Controller
          control={form.control}
          name="enrollmentOpen"
          render={({ field }) => <Switch id="sem-open" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <div>
          <FieldLabel htmlFor="sem-open">Enrollment open</FieldLabel>
          <FieldDescription>Students can register for this semester&apos;s sections.</FieldDescription>
        </div>
      </Field>
    </FormDialog>
  );
}

export function SemestersView() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(queries.semesters(api));
  const [dialog, setDialog] = useState<{ semester?: Semester } | null>(null);

  // Optimistic: the switch flips instantly; on failure the cached list is restored.
  const toggle = useMutation({
    mutationFn: ({ semester, open }: { semester: Semester; open: boolean }) =>
      api.updateSemester(semester.id, { enrollmentOpen: open }),
    onMutate: async ({ semester, open }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.semesters });
      const previous = queryClient.getQueryData<Semester[]>(queryKeys.semesters);
      queryClient.setQueryData<Semester[]>(queryKeys.semesters, (rows) =>
        rows?.map((s) => (s.id === semester.id ? { ...s, enrollmentOpen: open } : s)),
      );
      return { previous };
    },
    onError: (error, _v, context) => {
      queryClient.setQueryData(queryKeys.semesters, context?.previous);
      toast.error("Couldn't change enrollment", { description: getErrorMessage(error) });
    },
    onSuccess: (s) => toast.success(`Enrollment ${s.enrollmentOpen ? "opened" : "closed"} for ${s.name}`),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.semesters }),
  });

  const columns: Column<Semester>[] = [
    {
      id: "name",
      header: "Semester",
      cell: (s) => (
        <div>
          <p className="font-medium">{s.name}</p>
          <p className="text-xs text-muted-foreground">{formatDateRange(s.startDate, s.endDate)}</p>
        </div>
      ),
    },
    {
      id: "phase",
      header: "Status",
      cell: (s) => {
        const phase = PHASE[semesterPhase(s)];
        return (
          <Badge variant="secondary" className={phase.className}>
            {phase.label}
          </Badge>
        );
      },
      className: "hidden sm:table-cell",
    },
    { id: "tuition", header: "Per credit", cell: (s) => formatMoney(s.tuitionPerCredit), align: "right", className: "hidden md:table-cell" },
    {
      id: "open",
      header: "Enrollment",
      cell: (s) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={s.enrollmentOpen}
            onCheckedChange={(open) => toggle.mutate({ semester: s, open })}
            aria-label={`${s.enrollmentOpen ? "Close" : "Open"} enrollment for ${s.name}`}
          />
          <span className="hidden text-sm text-muted-foreground lg:inline">{s.enrollmentOpen ? "Open" : "Closed"}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (s) => (
        <Button variant="ghost" size="sm" onClick={() => setDialog({ semester: s })} aria-label={`Edit ${s.name}`}>
          <PencilIcon /> <span className="hidden sm:inline">Edit</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({})}>
          <PlusIcon /> New semester
        </Button>
      </div>
      <DataTable
        caption="Semesters"
        columns={columns}
        rows={data}
        getRowId={(s) => s.id}
        isLoading={isPending}
        empty={<EmptyState icon={CalendarRangeIcon} title="No semesters yet" description="Create a semester, add sections, then open enrollment." />}
      />
      {dialog && <SemesterDialog semester={dialog.semester} open onOpenChange={(open) => !open && setDialog(null)} />}
    </div>
  );
}
