"use client";

import Link from "next/link";
import { ClipboardListIcon, LogInIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";

/** Role-aware call to action on the (static) course page: register, sign in, or manage it as admin. */
export function CourseCta({ courseId, courseCode, isOffered }: { courseId: string; courseCode: string; isOffered: boolean }) {
  const { data: session, isPending } = useSession();
  const registerHref = `/dashboard/register?q=${encodeURIComponent(courseCode)}`;

  if (isPending) return <Skeleton className="h-9 w-48 rounded-2xl" />;

  if (session?.role === "ADMIN") {
    return (
      <Button asChild variant="outline" size="lg">
        <Link href={`/admin/courses/${courseId}`}>
          <SettingsIcon /> Manage this course
        </Link>
      </Button>
    );
  }
  if (session?.role === "INSTRUCTOR" || !isOffered) return null;
  if (session?.role === "STUDENT") {
    return (
      <Button asChild size="lg">
        <Link href={registerHref}>
          <ClipboardListIcon /> Register for {courseCode}
        </Link>
      </Button>
    );
  }
  return (
    <Button asChild size="lg">
      <Link href={`/login?next=${encodeURIComponent(registerHref)}`}>
        <LogInIcon /> Log in to register
      </Link>
    </Button>
  );
}
