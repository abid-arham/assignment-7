import type { Semester } from "@/lib/api/types";

/** Semesters a student can register in right now (the API lists newest first). */
export const openSemesters = (semesters: Semester[]) => semesters.filter((s) => s.enrollmentOpen);

/**
 * The semester a registration view should show: the one in the URL if it's open, otherwise the first
 * open one. Server prefetch and client render both call this, so they agree on the query key.
 */
export function pickRegistrationSemester(semesters: Semester[], requested?: string): Semester | undefined {
  const open = openSemesters(semesters);
  return open.find((s) => s.id === requested) ?? open[0];
}

export function semesterPhase(semester: Semester, now = new Date()): "upcoming" | "current" | "past" {
  if (now < new Date(semester.startDate)) return "upcoming";
  if (now > new Date(semester.endDate)) return "past";
  return "current";
}
