"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogInIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { PasswordInput } from "@/components/forms/password-input";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { loginAction } from "@/lib/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      // Resolves only on failure; on success the action redirects to the role's dashboard.
      queryClient.removeQueries({ queryKey: ["session"] }); // public navbar re-reads who is signed in
      const error = await loginAction(values, next);
      if (!applyServerErrors(setError, error.fieldErrors, ["email", "password"])) {
        setError("password", { type: "server", message: error.message });
      }
      toast.error("Couldn't sign you in", { description: error.message });
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending}>
      <FieldGroup className="gap-4">
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
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : <LogInIcon />}
          {pending ? "Signing in…" : "Log in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
