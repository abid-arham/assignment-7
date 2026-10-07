import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Course, Department } from "@/lib/api/types";
import { plural } from "@/lib/format";

export function CourseCard({ course, department }: { course: Course; department?: Department }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col rounded-3xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-heading text-lg font-semibold text-primary">{course.code}</span>
        <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </div>
      <h2 className="mt-1 font-sans text-base font-semibold tracking-normal">{course.title}</h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
        {course.description ?? "Course details will be published by the department."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{plural(course.credits, "credit")}</Badge>
        {department && <Badge variant="outline">{department.name}</Badge>}
      </div>
    </Link>
  );
}
