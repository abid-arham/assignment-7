"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { getErrorMessage, isApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/queries";
import type { MyEnrollment } from "@/lib/api/types";

/** Drop is optimistic: the row flips to DROPPED instantly and rolls back if the API refuses. */
export function useDropEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollment: MyEnrollment) => api.drop(enrollment.id),
    onMutate: async (enrollment) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.myEnrollments });
      const previous = queryClient.getQueryData<MyEnrollment[]>(queryKeys.myEnrollments);
      queryClient.setQueryData<MyEnrollment[]>(queryKeys.myEnrollments, (rows) =>
        rows?.map((row) =>
          row.id === enrollment.id ? { ...row, status: "DROPPED", droppedAt: new Date().toISOString() } : row,
        ),
      );
      return { previous };
    },
    onError: (error, enrollment, context) => {
      queryClient.setQueryData(queryKeys.myEnrollments, context?.previous);
      toast.error(`Couldn't drop ${enrollment.section.course.code}`, { description: getErrorMessage(error) });
    },
    onSuccess: (_data, enrollment) => {
      toast.success(`Dropped ${enrollment.section.course.code}`, {
        description: "Your seat was released. Regenerate your invoice if you already created one.",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments });
      void queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
}

/**
 * The API reports a missing prerequisite by course id ("Missing prerequisite: <id>"); look the course up
 * so the student reads "Complete CSE101 – Introduction to Programming first".
 */
export async function explainEnrollError(error: unknown): Promise<string> {
  if (isApiError(error)) {
    const match = /^Missing prerequisite: (\S+)$/.exec(error.message);
    if (match) {
      try {
        const course = await api.course(match[1]!);
        return `Complete ${course.code} – ${course.title} first (prerequisite).`;
      } catch {
        return "A prerequisite course hasn't been completed yet.";
      }
    }
  }
  return getErrorMessage(error);
}
