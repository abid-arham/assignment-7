"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { PasswordInput } from "@/components/forms/password-input";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { registerAction } from "@/lib/auth/actions";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const FIELDS = ["name", "email", "password", "confirmPassword"] as const;

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const error = await registerAction(values);
      // 409 = email already registered: show it on the email field.
      if (!applyServerErrors(setError, error.fieldErrors, FIELDS) && /email/i.test(error.message)) {
        setError("email", { type: "server", message: error.message });
      }
      toast.error("Couldn't create your account", { description: error.message });
    }),
  );

  const rules = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: password.length > 0 && password.length <= 72, label: "No more than 72 characters" },
  ];

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending}>
      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="password-rules"
            {...register("password")}
          />
          <ul id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={cn("flex items-center gap-1", rule.ok ? "text-success" : "text-muted-foreground")}
              >
                <CheckIcon className={cn("size-3", !rule.ok && "opacity-30")} aria-hidden />
                {rule.label}
              </li>
            ))}
          </ul>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : <UserPlusIcon />}
          {pending ? "Creating account…" : "Create student account"}
        </Button>
        <FieldDescription className="text-center">
          New accounts are students. Instructor access is granted by the registrar.
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
