import type { Metadata } from "next";
import Link from "next/link";
import { FieldSeparator } from "@/components/ui/field";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Quad student account to register for courses, track grades and pay tuition online.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Join Quad</h1>
        <p className="text-muted-foreground">Create your student account in under a minute.</p>
      </div>
      <GoogleButton label="Sign up with Google" />
      <FieldSeparator className="my-0">or with email</FieldSeparator>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
