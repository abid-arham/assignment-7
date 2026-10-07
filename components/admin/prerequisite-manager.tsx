"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GitBranchIcon, LinkIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_COURSES } from "@/components/admin/course-wizard/prerequisite-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { queries } from "@/lib/api/queries";
import type { CourseDetail } from "@/lib/api/types";

/**
 * Add/remove prerequisites on a server-rendered course page: mutate through the API, then
 * router.refresh() so the Server Component re-renders with the new chain.
 */
export function PrerequisiteManager({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [choice, setChoice] = useState("");
  const { data } = useQuery(queries.courses(api, ALL_COURSES));
  const linked = new Set(course.prerequisites.map((p) => p.prerequisiteId));
  const candidates = (data?.items ?? []).filter((c) => c.id !== course.id && !linked.has(c.id));

  const add = useMutation({
    mutationFn: (prerequisiteId: string) => api.addPrerequisite(course.id, prerequisiteId),
    onSuccess: () => {
      toast.success("Prerequisite added");
      setChoice("");
      startRefresh(() => router.refresh());
    },
    // 409 = it would create a cycle (A needs B needs A); the API explains which.
    onError: (error) => toast.error("Couldn't add that prerequisite", { description: getErrorMessage(error) }),
  });
  const remove = useMutation({
    mutationFn: (prerequisiteId: string) => api.removePrerequisite(course.id, prerequisiteId),
    onSuccess: () => {
      toast.success("Prerequisite removed");
      startRefresh(() => router.refresh());
    },
    onError: (error) => toast.error("Couldn't remove it", { description: getErrorMessage(error) }),
  });
  const busy = add.isPending || remove.isPending || refreshing;

  return (
    <div className="space-y-4">
      {course.prerequisites.length === 0 ? (
        <EmptyState
          icon={GitBranchIcon}
          title="No prerequisites"
          description="Any student can register for this course."
          className="py-8"
        />
      ) : (
        <ul className="divide-y rounded-2xl border">
          {course.prerequisites.map(({ prerequisite: p }) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/admin/courses/${p.id}`} className="min-w-0 hover:underline">
                <span className="font-medium text-primary">{p.code}</span>{" "}
                <span className="text-sm text-muted-foreground">{p.title}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove.mutate(p.id)}
                disabled={busy}
                aria-label={`Remove ${p.code} as a prerequisite`}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={choice} onValueChange={setChoice}>
          <SelectTrigger className="w-full sm:flex-1" aria-label="Course to add as a prerequisite">
            <SelectValue placeholder="Add a prerequisite…" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} · {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => add.mutate(choice)} disabled={!choice || busy}>
          {add.isPending ? <Spinner /> : <LinkIcon />} Link
        </Button>
      </div>
    </div>
  );
}
