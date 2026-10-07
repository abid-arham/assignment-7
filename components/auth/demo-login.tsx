"use client";

import { useState, useTransition } from "react";
import { GraduationCapIcon, PresentationIcon, RocketIcon, ShieldCheckIcon, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { demoLoginAction } from "@/lib/auth/actions";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const DEMOS: { role: Role; title: string; summary: string; icon: LucideIcon; tone: string }[] = [
  {
    role: "ADMIN",
    title: "Admin",
    summary: "Catalogue, semesters, users, analytics and audit log.",
    icon: ShieldCheckIcon,
    tone: "bg-primary/10 text-primary",
  },
  {
    role: "STUDENT",
    title: "Student",
    summary: "Register for sections, see grades, pay tuition.",
    icon: GraduationCapIcon,
    tone: "bg-highlight/20 text-highlight-foreground dark:text-highlight",
  },
  {
    role: "INSTRUCTOR",
    title: "Instructor",
    summary: "Teaching sections, class rosters and grade entry.",
    icon: PresentationIcon,
    tone: "bg-success/15 text-success",
  },
];

/** `emails` comes from the server-side demo config so the cards always show the account they use. */
export function DemoLogin({ emails }: { emails: Record<Role, string> }) {
  const [pending, startTransition] = useTransition();
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  const signInAs = (role: Role) => {
    setActiveRole(role);
    startTransition(async () => {
      const error = await demoLoginAction(role);
      toast.error("Demo login failed", { description: error.message });
      setActiveRole(null);
    });
  };

  return (
    <section aria-labelledby="demo-login-heading" className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-center">
        <RocketIcon className="size-4 text-primary" aria-hidden />
        <h2 id="demo-login-heading" className="font-sans text-sm font-semibold tracking-normal">
          Quick demo login
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DEMOS.map(({ role, title, summary, icon: Icon, tone }) => {
          const loading = pending && activeRole === role;
          return (
            <div
              key={role}
              className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-9 items-center justify-center rounded-xl", tone)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{title}</p>
                  <p className="truncate text-xs text-muted-foreground">{emails[role]}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{summary}</p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                disabled={pending}
                onClick={() => signInAs(role)}
                aria-label={`Demo login as ${title}`}
              >
                {loading && <Spinner />}
                {loading ? "Signing in…" : "Demo login"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
