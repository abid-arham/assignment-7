"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CourseEditDialog } from "@/components/admin/course-edit-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import type { Course } from "@/lib/api/types";

export function CourseActions({ course }: { course: Course }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const remove = useMutation({
    mutationFn: () => api.deleteCourse(course.id),
    onSuccess: () => {
      toast.success(`${course.code} removed from the catalogue`);
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.push("/admin/courses");
    },
    onError: (error) => toast.error("Couldn't delete the course", { description: getErrorMessage(error) }),
  });

  return (
    <>
      <Button variant="outline" onClick={() => setEditing(true)}>
        <PencilIcon /> Edit
      </Button>
      <ConfirmDialog
        title={`Delete ${course.code}?`}
        description="The course is hidden from the catalogue and registration. Past enrollments and grades are kept."
        confirmLabel="Delete course"
        destructive
        onConfirm={() => remove.mutate()}
        trigger={
          <Button variant="destructive" disabled={remove.isPending}>
            <Trash2Icon /> Delete
          </Button>
        }
      />
      <CourseEditDialog course={course} open={editing} onOpenChange={setEditing} />
    </>
  );
}
