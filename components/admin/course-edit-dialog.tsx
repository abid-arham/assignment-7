"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { FormDialog } from "@/components/shared/form-dialog";
import { api } from "@/lib/api/client";
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors";
import { queries } from "@/lib/api/queries";
import type { Course } from "@/lib/api/types";
import { courseEditSchema, type CourseEditInput } from "@/lib/validations/admin";

export function CourseEditDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: departments } = useQuery(queries.departments(api));
  const form = useForm<CourseEditInput>({
    resolver: zodResolver(courseEditSchema),
    mode: "onTouched",
    values: {
      title: course.title,
      description: course.description ?? "",
      credits: course.credits,
      departmentId: course.departmentId,
    },
  });
  const { errors } = form.formState;

  const save = useMutation({
    mutationFn: (values: CourseEditInput) =>
      api.updateCourse(course.id, { ...values, description: values.description || undefined }),
    onSuccess: (updated) => {
      toast.success(`${updated.code} updated`);
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh(); // detail page is server-rendered
      onOpenChange(false);
    },
    onError: (error) => {
      applyServerErrors(form.setError, getFieldErrors(error), ["title", "description", "credits", "departmentId"]);
      toast.error("Couldn't save the course", { description: getErrorMessage(error) });
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${course.code}`}
      description="The course code is permanent; everything else can change."
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      pending={save.isPending}
      submitLabel="Save changes"
    >
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="edit-title">Title</FieldLabel>
        <Input id="edit-title" aria-invalid={!!errors.title} {...form.register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>
      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="edit-description">Description</FieldLabel>
        <Textarea id="edit-description" rows={4} aria-invalid={!!errors.description} {...form.register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field data-invalid={!!errors.departmentId}>
          <FieldLabel htmlFor="edit-department">Department</FieldLabel>
          <Controller
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="edit-department" className="w-full" aria-invalid={!!errors.departmentId}>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.departmentId]} />
        </Field>
        <Field data-invalid={!!errors.credits}>
          <FieldLabel htmlFor="edit-credits">Credits</FieldLabel>
          <Input
            id="edit-credits"
            type="number"
            min={1}
            max={6}
            aria-invalid={!!errors.credits}
            {...form.register("credits", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.credits]} />
        </Field>
      </div>
    </FormDialog>
  );
}
