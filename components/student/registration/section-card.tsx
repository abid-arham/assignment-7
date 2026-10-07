"use client";

import Link from "next/link";
import { CheckIcon, PlusIcon, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeatMeter } from "@/components/shared/seat-meter";
import type { SectionWithRelations } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Where this student stands with a section's course. */
export type SectionStanding =
  | { kind: "available" }
  | { kind: "planned" }
  | { kind: "enrolled"; sectionCode: string }
  | { kind: "completed"; grade: string | null }
  | { kind: "full" };

export function SectionCard({
  section,
  standing,
  onAdd,
}: {
  section: SectionWithRelations;
  standing: SectionStanding;
  onAdd: () => void;
}) {
  const { course } = section;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md",
        standing.kind === "planned" && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/courses/${course.id}`} className="font-semibold text-primary hover:underline">
            {course.code}
          </Link>
          <h3 className="font-sans text-sm leading-snug font-medium tracking-normal">{course.title}</h3>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {plural(course.credits, "credit")}
        </Badge>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UserIcon className="size-3.5" /> Section {section.sectionCode} · {section.instructor.name}
      </p>

      <SeatMeter taken={section.enrolledCount} capacity={section.capacity} />

      <div className="mt-auto pt-1">
        {standing.kind === "available" && (
          <Button variant="outline" size="sm" className="w-full" onClick={onAdd}>
            <PlusIcon /> Add to plan
          </Button>
        )}
        {standing.kind === "planned" && (
          <Button variant="secondary" size="sm" className="w-full" disabled>
            <CheckIcon /> In your plan
          </Button>
        )}
        {standing.kind === "enrolled" && (
          <p className="rounded-xl bg-info/10 py-1.5 text-center text-xs font-medium text-info">
            Enrolled{standing.sectionCode !== section.sectionCode ? ` in section ${standing.sectionCode}` : ""}
          </p>
        )}
        {standing.kind === "completed" && (
          <p className="rounded-xl bg-success/10 py-1.5 text-center text-xs font-medium text-success">
            Completed{standing.grade ? ` · ${standing.grade}` : ""}
          </p>
        )}
        {standing.kind === "full" && (
          <p className="rounded-xl bg-destructive/10 py-1.5 text-center text-xs font-medium text-destructive">
            Section full
          </p>
        )}
      </div>
    </article>
  );
}
