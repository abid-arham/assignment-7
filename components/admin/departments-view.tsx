"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { api } from "@/lib/api/client";
import { getErrorMessage, getFieldErrors, isApiError } from "@/lib/api/errors";
import { queries, queryKeys } from "@/lib/api/queries";
import type { Department } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { departmentSchema, type DepartmentInput } from "@/lib/validations/admin";

function DepartmentDialog({
  department,
  open,
  onOpenChange,
}: {
  department?: Department;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<DepartmentInput, unknown, { name: string; code: string }>({
    resolver: zodResolver(departmentSchema),
    mode: "onTouched",
    values: { name: department?.name ?? "", code: department?.code ?? "" },
  });
  const { errors } = form.formState;

  const save = useMutation({
    mutationFn: (values: { name: string; code: string }) =>
      department ? api.updateDepartment(department.id, values) : api.createDepartment(values),
    onSuccess: (saved) => {
      toast.success(department ? `${saved.code} updated` : `${saved.name} created`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      // 409 = name or code already taken (both are unique).
      if (isApiError(error) && error.status === 409) form.setError("code", { message: "This name or code is already used" });
      else applyServerErrors(form.setError, getFieldErrors(error), ["name", "code"]);
      toast.error("Couldn't save the department", { description: getErrorMessage(error) });
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={department ? `Edit ${department.code}` : "New department"}
      description="Departments own courses and group students and instructors."
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
      pending={save.isPending}
      submitLabel={department ? "Save changes" : "Create department"}
    >
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="dept-name">Name</FieldLabel>
        <Input id="dept-name" placeholder="Civil Engineering" aria-invalid={!!errors.name} {...form.register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={!!errors.code}>
        <FieldLabel htmlFor="dept-code">Code</FieldLabel>
        <Input id="dept-code" placeholder="CE" className="w-32 uppercase" aria-invalid={!!errors.code} {...form.register("code")} />
        <FieldError errors={[errors.code]} />
      </Field>
    </FormDialog>
  );
}

export function DepartmentsView() {
  const queryClient = useQueryClient();
  const { data: departments, isPending } = useQuery(queries.departments(api));
  const { data: courses } = useQuery(queries.courses(api, ALL_COURSES));
  const [dialog, setDialog] = useState<{ department?: Department } | null>(null);

  const remove = useMutation({
    mutationFn: (d: Department) => api.deleteDepartment(d.id),
    onSuccess: (_r, d) => {
      toast.success(`${d.name} removed`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (error) => toast.error("Couldn't delete the department", { description: getErrorMessage(error) }),
  });

  const courseCount = (id: string) => courses?.items.filter((c) => c.departmentId === id).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({})}>
          <PlusIcon /> New department
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : !departments?.length ? (
        <EmptyState icon={Building2Icon} title="No departments yet" description="Create the first department to start adding courses." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => {
            const count = courseCount(d.id);
            return (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading font-semibold text-primary">
                      {d.code}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base">{d.name}</CardTitle>
                      <CardDescription>{plural(count, "course")} in the catalogue</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="px-0">
                    <Link href={`/admin/courses?departmentId=${d.id}`}>Browse its courses</Link>
                  </Button>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDialog({ department: d })}>
                    <PencilIcon /> Edit
                  </Button>
                  <ConfirmDialog
                    title={`Delete ${d.name}?`}
                    description={
                      count
                        ? `It still owns ${plural(count, "course")}. They stay in the catalogue but lose their department grouping — consider moving them first.`
                        : "The department is archived. You can't undo this from the dashboard."
                    }
                    confirmLabel="Delete department"
                    destructive
                    onConfirm={() => remove.mutate(d)}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2Icon /> Delete
                      </Button>
                    }
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {dialog && (
        <DepartmentDialog department={dialog.department} open onOpenChange={(open) => !open && setDialog(null)} />
      )}
    </div>
  );
}
