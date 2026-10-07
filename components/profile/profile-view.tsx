"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/dashboard/auth-provider";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { Spinner } from "@/components/shared/spinner";
import { RoleBadge } from "@/components/shared/status-badge";
import { api } from "@/lib/api/client";
import { getErrorMessage, getFieldErrors } from "@/lib/api/errors";
import { queries, queryKeys } from "@/lib/api/queries";
import { formatDate } from "@/lib/format";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export function ProfileView() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { data: departments } = useQuery(queries.departments(api));
  const department = departments?.find((d) => d.id === user.departmentId);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    values: { name: user.name },
  });
  const { errors, isDirty } = form.formState;

  const save = useMutation({
    mutationFn: (values: ProfileInput) => api.updateMe(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.me, updated);
      form.reset({ name: updated.name });
      toast.success("Profile saved");
    },
    onError: (error) => {
      applyServerErrors(form.setError, getFieldErrors(error), ["name"]);
      toast.error("Couldn't save your profile", { description: getErrorMessage(error) });
    },
  });

  const details: [string, React.ReactNode][] = [
    ["Email", user.email],
    ["Role", <RoleBadge key="role" role={role} />],
    ...(user.studentCode ? ([["Student ID", user.studentCode]] as [string, React.ReactNode][]) : []),
    ["Department", department ? `${department.name} (${department.code})` : "Not assigned"],
    ["Member since", formatDate(user.createdAt)],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photo</CardTitle>
          <CardDescription>Shown in the sidebar and on class rosters.</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <form onSubmit={form.handleSubmit((values) => save.mutate(values))} noValidate>
          <CardHeader>
            <CardTitle className="text-lg">Personal details</CardTitle>
            <CardDescription>Your name appears on transcripts, invoices and rosters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldGroup>
            <dl className="grid gap-x-6 gap-y-3 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="truncate font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <FieldDescription>
              Email, role and department are managed by the registrar&apos;s office.
            </FieldDescription>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="ghost" disabled={!isDirty || save.isPending} onClick={() => form.reset()}>
              Discard
            </Button>
            <Button type="submit" disabled={!isDirty || save.isPending}>
              {save.isPending ? <Spinner /> : <SaveIcon />} Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
