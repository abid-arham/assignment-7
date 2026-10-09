import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/auth/google-button";
import { DemoLogin } from "@/components/auth/demo-login";
import { LoginForm } from "@/components/auth/login-form";
import { FieldSeparator } from "@/components/ui/field";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to Quad as a student, instructor or administrator — or try a one-click demo account.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const emails = {
    ADMIN: DEMO_ACCOUNTS.ADMIN.email,
    STUDENT: DEMO_ACCOUNTS.STUDENT.email,
    INSTRUCTOR: DEMO_ACCOUNTS.INSTRUCTOR.email,
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Welcome back</h1>
        <p className="text-muted-foreground">Log in to your account to continue.</p>
      </div>

      <div className="mx-auto w-full max-w-sm space-y-4">
        {error === "google" && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Google sign-in didn&apos;t complete. Try again, or log in with your email.
          </p>
        )}
        <GoogleButton />
        <FieldSeparator>or with email</FieldSeparator>
        <LoginForm next={typeof next === "string" ? next : undefined} />
        <p className="text-center text-sm text-muted-foreground">
          New student?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <FieldSeparator className="my-0">or</FieldSeparator>

      <DemoLogin emails={emails} />
    </div>
  );
}
